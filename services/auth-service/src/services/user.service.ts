import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { RegisterDto } from '../dto/auth.dto';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserProfile } from '../types/user.types';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async createUser(dto: RegisterDto): Promise<UserProfile> {
    this.logger.log('Creating new user', { email: dto.email });

    try {
      await this.validateUserUniqueness(dto);

      const defaultRole = await this.getDefaultRole();
      const hashedPassword = await this.hashPassword(dto.password);

      const userData = await this.userRepository.createUser(dto, hashedPassword, defaultRole.id);
      const user = User.fromPrisma(userData);

      this.logger.log('User created successfully', { userId: user.id, email: user.email });
      return this.mapToUserProfile(userData);
    } catch (error) {
      this.logger.error('Failed to create user', { email: dto.email, error: error.message });
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserProfile | null> {
    this.logger.debug('Finding user by email', { email });

    const userData = await this.userRepository.findByEmail(email);
    return userData ? this.mapToUserProfile(userData) : null;
  }

  async findUserById(id: string): Promise<UserProfile | null> {
    this.logger.debug('Finding user by ID', { userId: id });

    const userData = await this.userRepository.findById(id);
    return userData ? this.mapToUserProfile(userData) : null;
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    this.logger.log('Updating user status', { userId, status });

    await this.userRepository.updateStatus(userId, status);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    this.logger.log('Updating user password', { userId });

    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  async updateEmailVerification(userId: string, verified: boolean): Promise<void> {
    this.logger.log('Updating email verification', { userId, verified });

    await this.userRepository.updateEmailVerification(userId, verified);
  }

  async updatePhoneVerification(userId: string, verified: boolean): Promise<void> {
    this.logger.log('Updating phone verification', { userId, verified });

    await this.userRepository.updatePhoneVerification(userId, verified);
  }

  async updateTwoFactor(userId: string, enabled: boolean, secret?: string): Promise<void> {
    this.logger.log('Updating two-factor authentication', { userId, enabled });

    await this.userRepository.updateTwoFactor(userId, enabled, secret);
  }

  async findUserByIdWithPassword(userId: string): Promise<any> {
    this.logger.debug('Finding user by ID with password', { userId });

    const userData = await this.userRepository.findById(userId);
    return userData;
  }

  private async validateUserUniqueness(dto: RegisterDto): Promise<void> {
    const emailExists = await this.userRepository.checkEmailExists(dto.email);
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    if (dto.phone) {
      const phoneExists = await this.userRepository.checkPhoneExists(dto.phone);
      if (phoneExists) {
        throw new ConflictException('Phone number already exists');
      }
    }
  }

  private async getDefaultRole() {
    const role = await this.roleRepository.findDefaultRole();
    if (!role) {
      throw new Error('Default role not found');
    }
    return role;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private mapToUserProfile(userData: any): UserProfile {
    const roles = userData.roles?.map((r: any) => r.role.name) || [];
    const permissions = userData.roles?.flatMap((r: any) => 
      r.role.permissions?.map((p: any) => p.permission.name) || []
    ) || [];

    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      status: userData.status,
      emailVerified: userData.emailVerified,
      phoneVerified: userData.phoneVerified,
      twoFactorEnabled: userData.twoFactorEnabled,
      roles,
      permissions,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
    };
  }
} 