import { UserStatus, AuthProvider } from '@prisma/client';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly status: UserStatus,
    public readonly authProvider: AuthProvider,
    public readonly emailVerified: boolean,
    public readonly phoneVerified: boolean,
    public readonly twoFactorEnabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly phone?: string,
    public readonly twoFactorSecret?: string,
    public readonly profilePicture?: string,
    public readonly timezone: string = 'UTC',
    public readonly locale: string = 'en',
    public readonly lastLoginAt?: Date,
    public readonly lastLoginIp?: string,
    public readonly loginAttempts: number = 0,
    public readonly lockedUntil?: Date,
    public readonly googleId?: string,
    public readonly facebookId?: string,
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isLocked(): boolean {
    return this.lockedUntil ? this.lockedUntil > new Date() : false;
  }

  get isVerified(): boolean {
    return this.emailVerified && this.phoneVerified;
  }

  get canLogin(): boolean {
    return this.isActive && !this.isLocked;
  }

  static fromPrisma(data: any): User {
    return new User(
      data.id,
      data.email,
      data.firstName,
      data.lastName,
      data.status,
      data.authProvider,
      data.emailVerified,
      data.phoneVerified,
      data.twoFactorEnabled,
      data.createdAt,
      data.updatedAt,
      data.phone,
      data.twoFactorSecret,
      data.profilePicture,
      data.timezone,
      data.locale,
      data.lastLoginAt,
      data.lastLoginIp,
      data.loginAttempts,
      data.lockedUntil,
      data.googleId,
      data.facebookId,
    );
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      status: this.status,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
} 