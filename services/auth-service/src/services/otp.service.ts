import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { OtpType, OtpStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async generateAndSendOtp(
    type: string,
    email?: string,
    phone?: string,
    userId?: string,
  ): Promise<string> {
    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const otpToken = await this.prisma.otpToken.create({
      data: {
        token: code,
        type: type as OtpType,
        email,
        phone,
        userId,
        expiresAt,
        status: OtpStatus.PENDING,
      },
    });

    // Send OTP based on type
    if (type === 'EMAIL_VERIFICATION' && email) {
      await this.emailService.sendEmailVerificationOtp(email, code, 'User');
    } else if (type === 'PASSWORD_RESET' && email) {
      await this.emailService.sendPasswordResetOtp(email, code, 'User');
    } else if (type === 'SMS_VERIFICATION' && phone) {
      // TODO: Implement SMS OTP sending
      console.log(`Sending OTP ${code} to phone: ${phone}`);
    }

    return otpToken.id;
  }

  async verifyOtp(token: string, email?: string, phone?: string): Promise<boolean> {
    const otpToken = await this.prisma.otpToken.findFirst({
      where: {
        token,
        OR: [
          { email: email || '' },
          { phone: phone || '' }
        ],
        status: OtpStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpToken) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { 
        status: OtpStatus.VERIFIED,
        verifiedAt: new Date()
      },
    });

    // If this was email verification, activate the user
    if (otpToken.type === OtpType.EMAIL_VERIFICATION && otpToken.userId) {
      await this.prisma.user.update({
        where: { id: otpToken.userId },
        data: { status: 'ACTIVE' },
      });
    }

    // For password reset, we don't need to do anything special here
    // The password update will be handled in the auth service

    return true;
  }
} 