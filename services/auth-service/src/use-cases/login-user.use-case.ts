import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/user.entity';
import { LoginDto } from '../dto/auth.dto';
import { TwoFactorService } from '../services/two-factor.service';
import * as bcrypt from 'bcryptjs';

export interface LoginUserResult {
  user: User;
  message: string;
  requiresTwoFactor?: boolean;
  twoFactorMethod?: string;
}

@Injectable()
export class LoginUserUseCase {
  private readonly logger = new Logger(LoginUserUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async execute(dto: LoginDto, clientIp?: string): Promise<LoginUserResult> {
    this.logger.log('Executing login user use case', { email: dto.email, clientIp });

    // Find user with roles
    const userData = await this.userRepository.findByEmailWithRoles(dto.email);
    if (!userData) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = User.fromPrisma(userData);

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active. Please verify your email.');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(dto.password, userData.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return {
          user,
          message: 'Two-factor authentication required',
          requiresTwoFactor: true,
          twoFactorMethod: 'totp_or_backup'
        };
      }

      // Verify 2FA code (supports both TOTP and backup codes)
      const userWithSecret = await this.userRepository.findById(user.id);
      if (!userWithSecret?.twoFactorSecret) {
        throw new BadRequestException('2FA secret not found');
      }

      try {
        // Use comprehensive 2FA verification that supports both TOTP and backup codes
        const verification = await this.twoFactorService.verifyTwoFactorCode(
          dto.twoFactorCode,
          userWithSecret.twoFactorSecret,
          user.id,
          clientIp,
          undefined // userAgent not available in login context
        );

        if (!verification.isValid) {
          throw new UnauthorizedException('Invalid 2FA code');
        }

        // Log successful 2FA verification with method used
        this.logger.log('2FA verification successful', { 
          userId: user.id, 
          method: verification.method,
          backupCodeUsed: verification.backupCodeUsed,
          clientIp
        });

      } catch (error) {
        // Handle rate limiting and other 2FA errors
        if (error instanceof UnauthorizedException) {
          throw error; // Re-throw rate limiting and other auth errors
        }
        
        this.logger.warn('2FA verification failed', { 
          userId: user.id, 
          error: error.message,
          clientIp
        });
        
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id, clientIp);

    this.logger.log('User logged in successfully', { 
      userId: user.id, 
      email: user.email,
      twoFactorUsed: user.twoFactorEnabled,
      clientIp
    });

    return {
      user,
      message: 'Login successful',
    };
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    await this.userRepository.incrementLoginAttempts(userId);

    // Lock account after 5 failed attempts
    const userData = await this.userRepository.findById(userId);
    if (userData && userData.loginAttempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await this.userRepository.lockAccount(userId, lockedUntil);
      
      this.logger.warn('Account locked due to failed login attempts', { 
        userId, 
        attempts: userData.loginAttempts,
        lockedUntil
      });
    }
  }
} 