import { Injectable, UnauthorizedException, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto, ChangePasswordDto, RefreshTokenDto } from '../dto/auth.dto';
import { JwtService as CustomJwtService } from './jwt.service';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { UserService } from './user.service';
import { CacheService } from './cache.service';
import { UserProfile } from '../types/user.types';
import { RegisterUserUseCase } from '../use-cases/register-user.use-case';
import { LoginUserUseCase } from '../use-cases/login-user.use-case';
import { UserStatus } from '@prisma/client';

export interface AuthResult {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: CustomJwtService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly cacheService: CacheService,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  async register(dto: any): Promise<AuthResult> {
    this.logger.log('User registration started', { email: dto.email });

    try {
      const result = await this.registerUserUseCase.execute(dto);
      const userProfile = await this.userService.findUserByEmail(result.user.email);

      if (!userProfile) {
        throw new Error('User profile not found after registration');
      }

      // Send verification email
      if (dto.email) {
        try {
          await this.otpService.generateAndSendOtp(
            'EMAIL_VERIFICATION',
            dto.email,
            undefined,
            result.user.id
          );
          this.logger.log('Verification email sent', { userId: result.user.id });
        } catch (error) {
          this.logger.warn('Failed to send verification email', { 
            userId: result.user.id, 
            error: error.message 
          });
        }
      }

      const authResult = this.buildAuthResult(userProfile);
      this.logger.log('User registration completed', { userId: result.user.id });
      return authResult;
    } catch (error) {
      this.logger.error('User registration failed', { 
        email: dto.email, 
        error: error.message 
      });
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const { email, password } = dto;

    try {
      const result = await this.loginUserUseCase.execute(dto);
      const userProfile = await this.userService.findUserByEmail(email);

      if (!userProfile) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const authResult = this.buildAuthResult(userProfile);
      this.logger.log('User login completed', { userId: result.user.id });
      return authResult;
    } catch (error) {
      this.logger.error('User login failed', { email, error: error.message });
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    this.logger.log('Changing password', { userId });

    try {
      const user = await this.userService.findUserById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get user with password for verification
      const userWithPassword = await this.userService.findUserByIdWithPassword(userId);
      if (!userWithPassword) {
        throw new UnauthorizedException('User not found');
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(dto.currentPassword, userWithPassword.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(dto.newPassword);

      // Update password
      await this.userService.updatePassword(userId, hashedPassword);

      this.logger.log('Password changed successfully', { userId });
    } catch (error) {
      this.logger.error('Password change failed', { userId, error: error.message });
      throw error;
    }
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResult> {
    this.logger.log('Refreshing token');

    try {
      const payload = await this.jwtService.verifyRefreshToken(dto.refreshToken);
      const user = await this.userService.findUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const authResult = this.buildAuthResult(user);
      this.logger.log('Token refreshed successfully', { userId: user.id });
      return authResult;
    } catch (error) {
      this.logger.error('Token refresh failed', { error: error.message });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async getUserProfileWithCache(userId: string): Promise<UserProfile> {
    const cacheKey = `user:${userId}:profile`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for user profile: ${userId}`);
        return JSON.parse(cached);
      }

      // If not in cache, get from database
      this.logger.debug(`Cache miss for user profile: ${userId}`);
      const user = await this.userService.findUserById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Cache the result for 10 minutes
      await this.cacheService.setex(cacheKey, 600, JSON.stringify(user));
      
      return user;
    } catch (error) {
      this.logger.error(`Error getting user profile with cache: ${userId}`, error);
      throw error;
    }
  }

  async getUserProfileFresh(userId: string): Promise<UserProfile> {
    try {
      // Bypass cache and get fresh data from database
      const user = await this.userService.findUserById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Update cache with fresh data
      const cacheKey = `user:${userId}:profile`;
      await this.cacheService.setex(cacheKey, 600, JSON.stringify(user));
      
      return user;
    } catch (error) {
      this.logger.error(`Error getting fresh user profile: ${userId}`, error);
      throw error;
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const cacheKey = `user:${userId}:profile`;
      await this.cacheService.del(cacheKey);
      this.logger.debug(`Cache invalidated for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating user cache: ${userId}`, error);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    this.logger.log('Forgot password request', { email });

    try {
      // Check if user exists
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        this.logger.warn('Forgot password requested for non-existent email', { email });
        return;
      }

      // Generate and send password reset OTP
      await this.otpService.generateAndSendOtp(
        'PASSWORD_RESET',
        email,
        undefined,
        user.id
      );

      this.logger.log('Password reset OTP sent', { email });
    } catch (error) {
      this.logger.error('Forgot password failed', { email, error: error.message });
      throw error;
    }
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    this.logger.log('Password reset request', { email });

    try {
      // Verify OTP
      const isValid = await this.otpService.verifyOtp(token, email);
      if (!isValid) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Find user
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await this.userService.updatePassword(user.id, hashedPassword);

      this.logger.log('Password reset successful', { email });
    } catch (error) {
      this.logger.error('Password reset failed', { email, error: error.message });
      throw error;
    }
  }

  private buildAuthResult(user: UserProfile): AuthResult {
    const accessToken = this.jwtService.generateAccessToken(user);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
} 