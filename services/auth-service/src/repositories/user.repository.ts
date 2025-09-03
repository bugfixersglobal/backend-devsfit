import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { User, UserWithRoles, UserProfile } from '../types/user.types';
import { UserStatus, AuthProvider } from '@prisma/client';
import { RegisterDto } from '../dto/auth.dto';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: RegisterDto, hashedPassword: string, defaultRoleId: string): Promise<UserWithRoles> {
    this.logger.debug('Creating user in repository', { email: dto.email });

    return this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: UserStatus.PENDING_VERIFICATION,
        authProvider: AuthProvider.LOCAL,
        timezone: dto.timezone || 'UTC',
        locale: dto.locale || 'en',
        roles: {
          create: {
            roleId: defaultRoleId,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<UserWithRoles | null> {
    this.logger.debug('Finding user by email', { email });

    return this.prisma.user.findFirst({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<UserWithRoles | null> {
    this.logger.debug('Finding user by ID', { userId: id });

    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
    this.logger.debug('Finding user by email with roles', { email });

    return this.prisma.user.findFirst({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    this.logger.debug('Updating user status', { userId, status });

    await this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    this.logger.debug('Updating user password', { userId });

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async updateLastLogin(userId: string, ip?: string): Promise<void> {
    this.logger.debug('Updating user last login', { userId, ip });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        loginAttempts: 0,
      },
    });
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    this.logger.debug('Incrementing login attempts', { userId });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: {
          increment: 1,
        },
      },
    });
  }

  async lockAccount(userId: string, lockedUntil: Date): Promise<void> {
    this.logger.debug('Locking user account', { userId, lockedUntil });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
      },
    });
  }

  async unlockAccount(userId: string): Promise<void> {
    this.logger.debug('Unlocking user account', { userId });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        loginAttempts: 0,
      },
    });
  }

  async updateEmailVerification(userId: string, verified: boolean): Promise<void> {
    this.logger.debug('Updating email verification status', { userId, verified });

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: verified },
    });
  }

  async updatePhoneVerification(userId: string, verified: boolean): Promise<void> {
    this.logger.debug('Updating phone verification status', { userId, verified });

    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: verified },
    });
  }

  async updateTwoFactor(userId: string, enabled: boolean, secret?: string): Promise<void> {
    this.logger.debug('Updating two-factor authentication', { userId, enabled });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: enabled,
        twoFactorSecret: secret,
      },
    });
  }

  async checkEmailExists(email: string): Promise<boolean> {
    this.logger.debug('Checking if email exists', { email });

    const user = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    this.logger.debug('Checking if phone exists', { phone });

    const user = await this.prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });

    return !!user;
  }
} 