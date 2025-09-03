import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private fromPhoneNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.fromPhoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && this.fromPhoneNumber) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    }
  }

  async sendPhoneVerificationOtp(phone: string, otp: string): Promise<void> {
    const message = `Devsfit: Your phone verification code is ${otp}. This code expires in 10 minutes.`;
    await this.sendSms(phone, message);
  }

  async sendLoginOtp(phone: string, otp: string): Promise<void> {
    const message = `Devsfit: Your login code is ${otp}. This code expires in 10 minutes. Never share this code with anyone.`;
    await this.sendSms(phone, message);
  }

  async sendPasswordResetOtp(phone: string, otp: string): Promise<void> {
    const message = `Devsfit: Your password reset code is ${otp}. This code expires in 10 minutes.`;
    await this.sendSms(phone, message);
  }

  private async sendSms(to: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(`SMS would be sent to ${to}: ${message}`);
        return;
      }
      throw new Error('SMS service not configured');
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromPhoneNumber,
        to,
      });

      this.logger.log(`SMS sent to ${to}: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      throw new Error('Failed to send SMS');
    }
  }
} 