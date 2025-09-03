import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    // For development, use MailHog
    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: 'mailhog',
        port: 1025,
        ignoreTLS: true,
      });
    } else {
      // For production, configure your email service (Gmail, SendGrid, etc.)
      this.transporter = nodemailer.createTransport({
        service: this.configService.get('EMAIL_SERVICE', 'gmail'),
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASSWORD'),
        },
      });
    }
  }

  async sendEmailVerificationOtp(
    email: string,
    otp: string,
    displayName: string,
  ): Promise<void> {
    const subject = 'Verify Your Email - Devsfit';
    const html = this.getEmailVerificationTemplate(otp, displayName);

    await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetOtp(
    email: string,
    otp: string,
    displayName: string,
  ): Promise<void> {
    const subject = 'Reset Your Password - Devsfit';
    const html = this.getPasswordResetTemplate(otp, displayName);

    await this.sendEmail(email, subject, html);
  }

  async sendLoginOtp(
    email: string,
    otp: string,
    displayName: string,
  ): Promise<void> {
    const subject = 'Your Login Code - Devsfit';
    const html = this.getLoginOtpTemplate(otp, displayName);

    await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(
    email: string,
    displayName: string,
  ): Promise<void> {
    const subject = 'Welcome to Devsfit!';
    const html = this.getWelcomeTemplate(displayName);

    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM', 'noreply@devsfit.com'),
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to}: ${result.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  private getEmailVerificationTemplate(otp: string, displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .otp-code { font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border: 2px dashed #2563eb; border-radius: 8px; color: #2563eb; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏋️ Devsfit</div>
          </div>
          
          <h1>Verify Your Email Address</h1>
          
          <p>Hi ${displayName},</p>
          
          <p>Thank you for signing up with Devsfit! Please use the following verification code to complete your registration:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Devsfit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(otp: string, displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .otp-code { font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; padding: 20px; background: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; color: #ef4444; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏋️ Devsfit</div>
          </div>
          
          <h1>Reset Your Password</h1>
          
          <p>Hi ${displayName},</p>
          
          <p>We received a request to reset your password. Use the following code to reset your password:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Devsfit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getLoginOtpTemplate(otp: string, displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Login Code</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .otp-code { font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; padding: 20px; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; color: #22c55e; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏋️ Devsfit</div>
          </div>
          
          <h1>Your Login Code</h1>
          
          <p>Hi ${displayName},</p>
          
          <p>Here's your login verification code:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in 10 minutes. For your security, never share this code with anyone.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Devsfit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeTemplate(displayName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Devsfit</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .welcome-banner { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏋️ Devsfit</div>
          </div>
          
          <div class="welcome-banner">
            <h1>Welcome to Devsfit!</h1>
            <p>Your fitness journey starts here</p>
          </div>
          
          <p>Hi ${displayName},</p>
          
          <p>Welcome to Devsfit! We're excited to have you join our fitness community. Your account has been successfully created and verified.</p>
          
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Browse our fitness packages</li>
            <li>Book your first session</li>
            <li>Track your progress</li>
          </ul>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          
          <p>Let's get fit together!</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Devsfit. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 