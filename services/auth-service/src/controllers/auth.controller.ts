import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { UserId, CurrentUser, ClientIp, UserAgent } from '../decorators/auth.decorators';
import { RequestUser } from '../types/user.types';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @ClientIp() clientIp: string,
  ) {
    this.logger.log('Registration request received', { 
      email: registerDto.email, 
      clientIp 
    });
    
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log('Registration successful', { 
        userId: result.user.id, 
        email: result.user.email 
      });
      return result;
    } catch (error) {
      this.logger.error('Registration failed', { 
        email: registerDto.email, 
        error: error.message 
      });
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @ClientIp() clientIp: string,
    @UserAgent() userAgent: string,
  ) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  async googleAuth() {
    throw new BadRequestException('Google OAuth not implemented');
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    throw new BadRequestException('Google OAuth not implemented');
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  async logout(@UserId() userId: string) {
    return { message: 'Logged out successfully' };
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP token' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const { token, email, phone } = verifyOtpDto;
    const result = await this.otpService.verifyOtp(token, email, phone);
    return { success: result, message: result ? 'OTP verified successfully' : 'Invalid OTP' };
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    const { type, email, phone } = resendOtpDto;
    const otpId = await this.otpService.generateAndSendOtp(type, email, phone);
    return { success: true, message: 'OTP sent successfully', otpId };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log('Forgot password request received', { 
      email: forgotPasswordDto.email 
    });
    
    try {
      await this.authService.forgotPassword(forgotPasswordDto.email);
      this.logger.log('Forgot password OTP sent', { 
        email: forgotPasswordDto.email 
      });
      return { 
        success: true, 
        message: 'If an account with this email exists, a password reset code has been sent' 
      };
    } catch (error) {
      this.logger.error('Forgot password failed', { 
        email: forgotPasswordDto.email, 
        error: error.message 
      });
      throw error;
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or password' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Reset password request received', { 
      email: resetPasswordDto.email 
    });
    
    try {
      await this.authService.resetPassword(
        resetPasswordDto.email,
        resetPasswordDto.token,
        resetPasswordDto.newPassword
      );
      this.logger.log('Password reset successful', { 
        email: resetPasswordDto.email 
      });
      return { 
        success: true, 
        message: 'Password reset successful' 
      };
    } catch (error) {
      this.logger.error('Password reset failed', { 
        email: resetPasswordDto.email, 
        error: error.message 
      });
      throw error;
    }
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  async changePassword(
    @UserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile with caching' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  async getProfile(@UserId() userId: string) {
    this.logger.log('Profile request received', { userId });
    
    try {
      const profile = await this.authService.getUserProfileWithCache(userId);
      this.logger.log('Profile retrieved successfully', { userId });
      return profile;
    } catch (error) {
      this.logger.error('Profile retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  @Get('profile/fresh')
  @ApiOperation({ summary: 'Get fresh user profile (bypass cache)' })
  @ApiResponse({ status: 200, description: 'Fresh user profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  async getFreshProfile(@UserId() userId: string) {
    this.logger.log('Fresh profile request received', { userId });
    
    try {
      const profile = await this.authService.getUserProfileFresh(userId);
      this.logger.log('Fresh profile retrieved successfully', { userId });
      return profile;
    } catch (error) {
      this.logger.error('Fresh profile retrieval failed', { userId, error: error.message });
      throw error;
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user basic info (from JWT)' })
  @ApiResponse({ status: 200, description: 'Current user info retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  async getCurrentUser(@CurrentUser() user: RequestUser) {
    this.logger.log('Current user request received', { userId: user.id });
    
    // Return basic user info from JWT (fast, no database query)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      status: user.status,
      roles: user.roles,
      permissions: user.permissions
    };
  }
} 