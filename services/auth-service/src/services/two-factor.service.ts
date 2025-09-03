import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  isValid: boolean;
  backupCodeUsed?: boolean;
  method?: 'totp' | 'backup_code' | 'webauthn';
}

export interface RateLimitInfo {
  attempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
  remainingAttempts: number;
}

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  
  // Rate limiting constants - Industry standard
  private readonly MAX_2FA_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ATTEMPTS_PER_WINDOW = 10;

  constructor(
    private readonly configService: ConfigService, 
    private readonly prismaService: PrismaService
  ) {}

  /**
   * Generate 2FA secret and QR code with enhanced security
   */
  async generateTwoFactorSecret(userId: string, email: string): Promise<TwoFactorSetup> {
    // Check if user already has 2FA enabled
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });

    if (user?.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled for this user');
    }

    // Generate cryptographically secure secret (32 characters for enhanced security)
    const secret = speakeasy.generateSecret({
      name: `Devsfit (${email})`,
      issuer: 'Devsfit',
      length: 32, // Industry standard for strong security
    });

    // Generate QR code with error correction
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate cryptographically secure backup codes
    const backupCodes = this.generateBackupCodes(10); // Industry standard: 8-10 codes

    // Store hashed backup codes securely
    await this.storeHashedBackupCodes(userId, backupCodes);

    // Store temporary 2FA secret (will be permanently saved when user enables 2FA)
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      }
    });

    this.logger.log('2FA secret generated with enhanced security', { 
      userId, 
      secretLength: secret.base32?.length,
      backupCodesCount: backupCodes.length 
    });

    return {
      secret: secret.base32!,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Store backup codes with cryptographic hashing
   */
  private async storeHashedBackupCodes(userId: string, codes: string[]): Promise<void> {
    // Clear any existing backup codes
    await this.prismaService.backupCode.deleteMany({
      where: { userId }
    });

    // Hash each backup code before storage
    const hashedBackupCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        codeHash: await bcrypt.hash(code, 12), // Industry standard: bcrypt rounds 12+
        originalCode: code, // Will be removed after hashing
      }))
    );

    // Store only hashed versions
    const backupCodeData = hashedBackupCodes.map(({ userId, codeHash }) => ({
      userId,
      codeHash,
      code: null, // Backward compatibility
    }));

    await this.prismaService.backupCode.createMany({
      data: backupCodeData,
    });

    this.logger.log('Backup codes securely hashed and stored', { 
      userId, 
      count: codes.length,
      hashRounds: 12
    });
  }

  /**
   * Get user backup codes (returns count only for security)
   */
  async getUserBackupCodesInfo(userId: string): Promise<{ totalCodes: number; usedCodes: number }> {
    const [totalCodes, usedCodes] = await Promise.all([
      this.prismaService.backupCode.count({
        where: { userId }
      }),
      this.prismaService.backupCode.count({
        where: { userId, isUsed: true }
      })
    ]);

    return { totalCodes, usedCodes };
  }

  /**
   * Verify backup code with rate limiting and secure comparison
   */
  async verifyAndUseBackupCode(userId: string, code: string, clientIp?: string, userAgent?: string): Promise<TwoFactorVerify> {
    // Check rate limiting
    const rateLimitInfo = await this.checkRateLimit(userId, '2fa_backup', clientIp, userAgent);
    if (rateLimitInfo.isLocked) {
      this.logger.warn('2FA backup code verification blocked - rate limited', { 
        userId, 
        clientIp,
        attemptsRemaining: rateLimitInfo.remainingAttempts
      });
      throw new UnauthorizedException(`Too many attempts. Try again in ${Math.ceil((rateLimitInfo.lockedUntil!.getTime() - Date.now()) / 60000)} minutes.`);
    }

    // Get all unused backup codes for this user
    const backupCodes = await this.prismaService.backupCode.findMany({
      where: {
        userId,
        isUsed: false,
      },
      select: {
        id: true,
        codeHash: true,
      }
    });

    if (backupCodes.length === 0) {
      await this.recordFailedAttempt(userId, '2fa_backup', clientIp);
      this.logger.warn('No backup codes available', { userId });
      return { isValid: false };
    }

    // Securely compare the provided code against all hashed backup codes
    for (const backupCode of backupCodes) {
      const isMatch = await bcrypt.compare(code.trim().toUpperCase(), backupCode.codeHash);
      
      if (isMatch) {
        // Mark backup code as used
        await this.prismaService.backupCode.update({
          where: { id: backupCode.id },
          data: {
            isUsed: true,
            usedAt: new Date(),
          },
        });

        // Clear rate limiting on successful verification
        await this.clearRateLimit(userId, '2fa_backup');

        this.logger.log('2FA backup code successfully verified and consumed', { 
          userId, 
          backupCodeId: backupCode.id,
          clientIp
        });

        return { isValid: true, backupCodeUsed: true, method: 'backup_code' };
      }
    }

    // Record failed attempt
    await this.recordFailedAttempt(userId, '2fa_backup', clientIp, userAgent);
    
    this.logger.warn('2FA backup code verification failed', { 
      userId, 
      clientIp,
      attemptsRemaining: rateLimitInfo.remainingAttempts - 1
    });

    return { isValid: false };
  }

  /**
   * Generate new backup codes for user with enhanced security
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    // Verify user has 2FA enabled
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException('2FA must be enabled before regenerating backup codes');
    }

    // Delete existing unused backup codes
    await this.prismaService.backupCode.deleteMany({
      where: {
        userId,
        isUsed: false,
      },
    });

    // Generate new backup codes
    const newBackupCodes = this.generateBackupCodes(10);
    await this.storeHashedBackupCodes(userId, newBackupCodes);

    this.logger.log('2FA backup codes regenerated', { 
      userId,
      newCodesCount: newBackupCodes.length
    });

    return newBackupCodes;
  }

  /**
   * Verify 2FA token with comprehensive rate limiting and security
   */
  async verifyTwoFactorToken(
    token: string, 
    secret: string, 
    userId: string, 
    clientIp?: string,
    userAgent?: string
  ): Promise<TwoFactorVerify> {
    // Input validation
    if (!token || !secret || !userId) {
      throw new BadRequestException('Invalid verification parameters');
    }

    // Normalize token input
    const normalizedToken = token.replace(/\s/g, '').trim();
    
    if (!/^\d{6}$/.test(normalizedToken)) {
      throw new BadRequestException('Invalid token format. Must be 6 digits.');
    }

    // Check rate limiting
    const rateLimitInfo = await this.checkRateLimit(userId, '2fa_totp', clientIp, userAgent);
    if (rateLimitInfo.isLocked) {
      this.logger.warn('2FA TOTP verification blocked - rate limited', { 
        userId, 
        clientIp,
        attemptsRemaining: rateLimitInfo.remainingAttempts
      });
      throw new UnauthorizedException(`Too many attempts. Try again in ${Math.ceil((rateLimitInfo.lockedUntil!.getTime() - Date.now()) / 60000)} minutes.`);
    }

    try {
      // Verify TOTP with enhanced security parameters
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: normalizedToken,
        window: 2, // Allow 2 time steps (60 seconds) for clock skew - industry standard
        time: Math.floor(Date.now() / 1000) // Current Unix timestamp
      });

      if (isValid) {
        // Clear rate limiting on successful verification
        await this.clearRateLimit(userId, '2fa_totp');
        
        this.logger.log('2FA TOTP token successfully verified', { 
          userId, 
          clientIp,
          tokenLength: normalizedToken.length
        });
        
        return { isValid: true, method: 'totp' };
      } else {
            // Record failed attempt
    await this.recordFailedAttempt(userId, '2fa_totp', clientIp, userAgent);
        
        this.logger.warn('2FA TOTP verification failed - invalid token', { 
          userId, 
          clientIp,
          attemptsRemaining: rateLimitInfo.remainingAttempts - 1
        });
        
        return { isValid: false };
      }
    } catch (error) {
      await this.recordFailedAttempt(userId, '2fa_totp', clientIp);
      
      this.logger.error('2FA TOTP verification error', { 
        userId,
        clientIp,
        error: error.message 
      });
      
      return { isValid: false };
    }
  }

  /**
   * Comprehensive 2FA verification supporting multiple methods
   */
  async verifyTwoFactorCode(
    code: string, 
    secret: string, 
    userId: string, 
    clientIp?: string,
    userAgent?: string
  ): Promise<TwoFactorVerify> {
    // Try TOTP first (6 digits)
    if (/^\d{6}$/.test(code.trim())) {
      const totpResult = await this.verifyTwoFactorToken(code, secret, userId, clientIp, userAgent);
      if (totpResult.isValid) {
        return totpResult;
      }
    }

    // Try backup code as fallback (6 digits as well, but different validation)
    const backupResult = await this.verifyAndUseBackupCode(userId, code, clientIp, userAgent);
    return backupResult;
  }

  /**
   * Generate cryptographically secure backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate cryptographically secure 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Get current TOTP token (for testing/development only)
   */
  getCurrentToken(secret: string): string {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Token generation not available in production');
    }

    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }

  /**
   * Validate secret format with enhanced checks
   */
  validateSecret(secret: string): boolean {
    if (!secret || typeof secret !== 'string') {
      return false;
    }

    // Check length (should be 32 characters for base32)
    if (secret.length < 16 || secret.length > 64) {
      return false;
    }

    // Check base32 format
    const base32Regex = /^[A-Z2-7]+$/;
    if (!base32Regex.test(secret)) {
      return false;
    }

    try {
      // Test if secret can generate a valid token
      speakeasy.totp({
        secret,
        encoding: 'base32',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting implementation with Redis-like functionality using database
   */
  private async checkRateLimit(
    userId: string, 
    action: string, 
    clientIp?: string,
    userAgent?: string
  ): Promise<RateLimitInfo> {
    const key = `${userId}:${action}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.RATE_LIMIT_WINDOW);

    // Get recent attempts
    const recentAttempts = await this.prismaService.rateLimitAttempt.findMany({
      where: {
        key,
        createdAt: { gte: windowStart }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attempts = recentAttempts.length;
    const isLocked = attempts >= this.MAX_2FA_ATTEMPTS;
    const remainingAttempts = Math.max(0, this.MAX_2FA_ATTEMPTS - attempts);

    let lockedUntil: Date | undefined;
    if (isLocked && recentAttempts.length > 0) {
      lockedUntil = new Date(recentAttempts[0].createdAt.getTime() + this.LOCKOUT_DURATION);
      
      // Check if lockout period has expired
      if (now > lockedUntil) {
        // Clear expired attempts
        await this.clearRateLimit(userId, action);
        return { attempts: 0, isLocked: false, remainingAttempts: this.MAX_2FA_ATTEMPTS };
      }
    }

    return {
      attempts,
      isLocked: isLocked && now < (lockedUntil || now),
      lockedUntil,
      remainingAttempts
    };
  }

  /**
   * Record failed authentication attempt
   */
  private async recordFailedAttempt(
    userId: string, 
    action: string, 
    clientIp?: string,
    userAgent?: string
  ): Promise<void> {
    const key = `${userId}:${action}`;
    
    await this.prismaService.rateLimitAttempt.create({
      data: {
        key,
        userId,
        action,
        clientIp,
        userAgent: userAgent?.substring(0, 255), // Limit length for database
        createdAt: new Date()
      }
    });
  }

  /**
   * Clear rate limiting on successful authentication
   */
  private async clearRateLimit(userId: string, action: string): Promise<void> {
    const key = `${userId}:${action}`;
    
    await this.prismaService.rateLimitAttempt.deleteMany({
      where: { key }
    });
  }

  /**
   * Get rate limit status for monitoring
   */
  async getRateLimitStatus(userId: string, action: string): Promise<RateLimitInfo> {
    return this.checkRateLimit(userId, action);
  }
} 