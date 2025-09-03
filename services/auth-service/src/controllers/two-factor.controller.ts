import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorService } from '../services/two-factor.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { Enable2FADto, TwoFactorSetupDto, Verify2FADto } from '../dto/auth.dto';

@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
export class TwoFactorController {
  private readonly logger = new Logger(TwoFactorController.name);

  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @ApiOperation({ summary: 'Setup 2FA for user' })
  @ApiResponse({ status: 200, description: '2FA setup successful', type: TwoFactorSetupDto })
  @ApiResponse({ status: 400, description: '2FA already enabled or invalid request' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiHeader({ 
    name: 'user-agent', 
    required: false, 
    description: 'Browser/App identifier for security audit (e.g., "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")' 
  })
  async setupTwoFactor(
    @Request() req: any,
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<TwoFactorSetupDto> {
    const userId = req.user.id;
    
    this.logger.log('2FA setup requested', { 
      userId, 
      clientIp,
      userAgent: userAgent?.substring(0, 100) // Limit user agent length
    });

    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const setup = await this.twoFactorService.generateTwoFactorSecret(userId, user.email);

    this.logger.log('2FA setup completed successfully', { 
      userId,
      clientIp,
      backupCodesGenerated: setup.backupCodes.length
    });

    return {
      secret: setup.secret,
      qrCode: setup.qrCode,
      backupCodes: setup.backupCodes,
    };
  }

  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({ summary: 'Enable 2FA with verification code' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or 2FA already enabled' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiHeader({ 
    name: 'user-agent', 
    required: false, 
    description: 'Browser/App identifier for security audit (e.g., "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")' 
  })
  async enableTwoFactor(
    @Request() req: any, 
    @Body() dto: Enable2FADto,
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ message: string; backupCodesRemaining: number }> {
    const userId = req.user.id;
    
    this.logger.log('2FA enable requested', { 
      userId, 
      clientIp,
      userAgent: userAgent?.substring(0, 100)
    });

    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Get user with 2FA secret
    const userWithSecret = await this.userService.findUserByIdWithPassword(userId);
    
    if (!userWithSecret?.twoFactorSecret) {
      throw new BadRequestException('2FA setup not completed. Please setup 2FA first.');
    }

    // Verify the token with enhanced security
    const verification = await this.twoFactorService.verifyTwoFactorToken(
      dto.token,
      userWithSecret.twoFactorSecret,
      userId,
      clientIp
    );

    if (!verification.isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA
    await this.userService.updateTwoFactor(userId, true, userWithSecret.twoFactorSecret);

    // Get backup codes info
    const backupCodesInfo = await this.twoFactorService.getUserBackupCodesInfo(userId);

    this.logger.log('2FA enabled successfully', { 
      userId,
      clientIp,
      verificationMethod: verification.method
    });

    return { 
      message: 'Two-factor authentication enabled successfully',
      backupCodesRemaining: backupCodesInfo.totalCodes - backupCodesInfo.usedCodes
    };
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or 2FA not enabled' })
  @ApiHeader({ 
    name: 'user-agent', 
    required: false, 
    description: 'Browser/App identifier for security audit (e.g., "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")' 
  })
  async disableTwoFactor(
    @Request() req: any, 
    @Body() dto: Enable2FADto,
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    
    this.logger.log('2FA disable requested', { 
      userId, 
      clientIp,
      userAgent: userAgent?.substring(0, 100)
    });

    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Get user with 2FA secret
    const userWithSecret = await this.userService.findUserByIdWithPassword(userId);
    
    if (!userWithSecret?.twoFactorSecret) {
      throw new BadRequestException('2FA secret not found');
    }

    // Verify the token with enhanced security
    const verification = await this.twoFactorService.verifyTwoFactorCode(
      dto.token,
      userWithSecret.twoFactorSecret,
      userId,
      clientIp,
      userAgent
    );

    if (!verification.isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Disable 2FA and clear all backup codes
    await this.userService.updateTwoFactor(userId, false, null);

    this.logger.log('2FA disabled successfully', { 
      userId,
      clientIp,
      verificationMethod: verification.method
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Get comprehensive 2FA status' })
  @ApiResponse({ status: 200, description: '2FA status retrieved' })
  async getTwoFactorStatus(
    @Request() req: any
  ): Promise<{ 
    enabled: boolean; 
    backupCodesInfo?: { 
      total: number; 
      used: number; 
      remaining: number; 
    };
    rateLimitStatus?: {
      totpAttempts: number;
      backupAttempts: number;
    };
  }> {
    const userId = req.user.id;
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const response: any = { enabled: user.twoFactorEnabled };

    if (user.twoFactorEnabled) {
      // Get backup codes info
      const backupCodesInfo = await this.twoFactorService.getUserBackupCodesInfo(userId);
      response.backupCodesInfo = {
        total: backupCodesInfo.totalCodes,
        used: backupCodesInfo.usedCodes,
        remaining: backupCodesInfo.totalCodes - backupCodesInfo.usedCodes
      };

      // Get rate limit status (for security monitoring)
      const [totpRateLimit, backupRateLimit] = await Promise.all([
        this.twoFactorService.getRateLimitStatus(userId, '2fa_totp'),
        this.twoFactorService.getRateLimitStatus(userId, '2fa_backup')
      ]);

      response.rateLimitStatus = {
        totpAttempts: totpRateLimit.attempts,
        backupAttempts: backupRateLimit.attempts
      };
    }

    return response;
  }

  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 attempts per 5 minutes
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  @ApiResponse({ status: 200, description: '2FA verification successful', schema: {
    type: 'object',
    properties: {
      isValid: { type: 'boolean' },
      method: { type: 'string', enum: ['totp', 'backup_code'] }
    }
  }})
  @ApiResponse({ status: 400, description: 'Invalid token, missing fields, or user not found' })
  @ApiHeader({ 
    name: 'user-agent', 
    required: false, 
    description: 'Browser/App identifier for security audit (e.g., "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")' 
  })
  async verifyTwoFactor(
    @Body() dto: Verify2FADto,
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ isValid: boolean; method?: string }> {
    // Input validation
    if (!dto || !dto.userId || !dto.token) {
      throw new BadRequestException('Missing required fields: userId and token are required');
    }

    this.logger.log('2FA verification requested', { 
      userId: dto.userId, 
      clientIp,
      userAgent: userAgent?.substring(0, 100)
    });

    const user = await this.userService.findUserById(dto.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Get user with 2FA secret
    const userWithSecret = await this.userService.findUserByIdWithPassword(dto.userId);
    
    if (!userWithSecret?.twoFactorSecret) {
      throw new BadRequestException('2FA secret not found');
    }

    // Verify the token with comprehensive method support
    const verification = await this.twoFactorService.verifyTwoFactorCode(
      dto.token,
      userWithSecret.twoFactorSecret,
      dto.userId,
      clientIp,
      userAgent
    );

    this.logger.log('2FA verification result', { 
      userId: dto.userId, 
      isValid: verification.isValid,
      method: verification.method,
      clientIp
    });

    return { 
      isValid: verification.isValid,
      method: verification.method
    };
  }

  @Get('backup-codes/info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Get backup codes information (count only)' })
  @ApiResponse({ status: 200, description: 'Backup codes info retrieved' })
  async getBackupCodesInfo(
    @Request() req: any
  ): Promise<{ total: number; used: number; remaining: number }> {
    const userId = req.user.id;
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    const backupCodesInfo = await this.twoFactorService.getUserBackupCodesInfo(userId);
    
    return {
      total: backupCodesInfo.totalCodes,
      used: backupCodesInfo.usedCodes,
      remaining: backupCodesInfo.totalCodes - backupCodesInfo.usedCodes
    };
  }

  @Post('backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @Throttle({ default: { limit: 2, ttl: 3600000 } }) // 2 regenerations per hour
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({ status: 200, description: 'New backup codes generated' })
  @ApiResponse({ status: 429, description: 'Too many regeneration requests' })
  @ApiHeader({ 
    name: 'user-agent', 
    required: false, 
    description: 'Browser/App identifier for security audit (e.g., "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")' 
  })
  async regenerateBackupCodes(
    @Request() req: any,
    @Body() dto: Enable2FADto, // Require 2FA verification
    @Ip() clientIp: string,
    @Headers('user-agent') userAgent?: string
  ): Promise<{ backupCodes: string[]; message: string }> {
    const userId = req.user.id;
    
    this.logger.log('Backup codes regeneration requested', { 
      userId, 
      clientIp,
      userAgent: userAgent?.substring(0, 100)
    });

    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Require 2FA verification for security
    const userWithSecret = await this.userService.findUserByIdWithPassword(userId);
    
    if (!userWithSecret?.twoFactorSecret) {
      throw new BadRequestException('2FA secret not found');
    }

    // Verify current 2FA token before regenerating
    const verification = await this.twoFactorService.verifyTwoFactorCode(
      dto.token,
      userWithSecret.twoFactorSecret,
      userId,
      clientIp,
      userAgent
    );

    if (!verification.isValid) {
      throw new BadRequestException('Invalid 2FA code. Verification required to regenerate backup codes.');
    }

    // Generate new backup codes
    const newBackupCodes = await this.twoFactorService.regenerateBackupCodes(userId);
    
    this.logger.log('Backup codes regenerated successfully', { 
      userId,
      clientIp,
      newCodesCount: newBackupCodes.length
    });

    return { 
      backupCodes: newBackupCodes,
      message: 'Backup codes successfully regenerated. Store them securely!'
    };
  }

  // Remove the test endpoints for production security
  // Test endpoints should only be available in development
} 