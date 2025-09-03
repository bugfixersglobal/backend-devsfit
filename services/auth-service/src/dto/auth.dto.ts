import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength, 
  IsBoolean, 
  IsOptional, 
  Length, 
  Matches,
  IsPhoneNumber,
  IsEnum,
  IsUUID,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';
import { OtpType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number and special character',
    },
  )
  password: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  token: string;

  @ApiProperty({ enum: OtpType })
  @IsEnum(OtpType)
  type: OtpType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class ResendOtpDto {
  @ApiProperty({ enum: OtpType })
  @IsEnum(OtpType)
  type: OtpType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  token: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number and special character',
    },
  )
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123!' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain uppercase, lowercase, number and special character',
    },
  )
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  logoutFromAllDevices?: boolean;
}

export class Enable2FADto {
  @ApiProperty({ 
    example: '123456',
    description: 'Six-digit TOTP code from authenticator app or backup code',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @Length(6, 6, { message: 'Token must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Token must contain only digits' })
  token: string;
}

export class Verify2FADto {
  @ApiProperty({ 
    example: 'user-uuid',
    description: 'User ID for verification'
  })
  @IsString()
  @IsUUID(4, { message: 'Invalid user ID format' })
  userId: string;

  @ApiProperty({ 
    example: '123456',
    description: 'Six-digit TOTP code from authenticator app or backup code',
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @Length(6, 6, { message: 'Token must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Token must contain only digits' })
  token: string;
}

export class BackupCodesInfoDto {
  @ApiProperty({ description: 'Total backup codes generated' })
  total: number;

  @ApiProperty({ description: 'Number of backup codes used' })
  used: number;

  @ApiProperty({ description: 'Remaining unused backup codes' })
  remaining: number;
}

export class RateLimitStatusDto {
  @ApiProperty({ description: 'TOTP verification attempts in current window' })
  totpAttempts: number;

  @ApiProperty({ description: 'Backup code verification attempts in current window' })
  backupAttempts: number;
}

export class TwoFactorStatusDto {
  @ApiProperty({ description: 'Whether 2FA is enabled' })
  enabled: boolean;

  @ApiProperty({ 
    description: 'Backup codes information',
    required: false,
    type: () => BackupCodesInfoDto
  })
  backupCodesInfo?: BackupCodesInfoDto;

  @ApiProperty({ 
    description: 'Rate limiting status',
    required: false,
    type: () => RateLimitStatusDto
  })
  rateLimitStatus?: RateLimitStatusDto;
}

export class TwoFactorVerificationDto {
  @ApiProperty({ description: 'Whether verification was successful' })
  isValid: boolean;

  @ApiProperty({ 
    description: 'Verification method used',
    enum: ['totp', 'backup_code', 'webauthn'],
    required: false
  })
  method?: 'totp' | 'backup_code' | 'webauthn';

  @ApiProperty({ description: 'Whether a backup code was consumed', required: false })
  backupCodeUsed?: boolean;
}

export class Enhanced2FASetupDto {
  @ApiProperty({ description: '2FA secret for setup' })
  secret: string;

  @ApiProperty({ description: 'QR code data URL for easy setup' })
  qrCode: string;

  @ApiProperty({ description: 'Backup codes for recovery', type: [String] })
  backupCodes: string[];

  @ApiProperty({ description: 'Setup timestamp' })
  setupAt?: Date;

  @ApiProperty({ description: 'Security level achieved' })
  securityLevel?: 'AAL1' | 'AAL2' | 'AAL3';
}

// Future WebAuthn/FIDO2 support DTOs
export class WebAuthnRegistrationDto {
  @ApiProperty({ description: 'WebAuthn credential creation options' })
  credentialCreationOptions: any;

  @ApiProperty({ description: 'Challenge for registration' })
  challenge: string;
}

export class WebAuthnVerificationDto {
  @ApiProperty({ description: 'WebAuthn credential assertion options' })
  credentialRequestOptions: any;

  @ApiProperty({ description: 'Challenge for verification' })
  challenge: string;
}

// Enhanced login DTO for comprehensive authentication
export class EnhancedLoginDto extends LoginDto {
  @ApiProperty({ 
    description: 'Device fingerprint for security tracking',
    required: false
  })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiProperty({ 
    description: 'Two-factor authentication code',
    required: false,
    example: '123456'
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Token must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Token must contain only digits' })
  twoFactorCode?: string;

  @ApiProperty({ 
    description: 'WebAuthn assertion response for passwordless auth',
    required: false
  })
  @IsOptional()
  webAuthnResponse?: any;
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  profilePicture?: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  phoneVerified: boolean;

  @ApiProperty()
  twoFactorEnabled: boolean;

  @ApiProperty()
  roles: string[];

  @ApiProperty()
  permissions: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastLoginAt?: Date;
}

export class TwoFactorSetupDto {
  @ApiProperty()
  secret: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  backupCodes: string[];
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: UserProfileDto;

  @ApiProperty()
  expiresIn: number;
} 