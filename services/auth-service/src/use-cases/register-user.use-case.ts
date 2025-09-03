import { Injectable, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/auth.dto';
import * as bcrypt from 'bcryptjs';

export interface RegisterUserResult {
  user: User;
  message: string;
}

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisterUserResult> {
    this.logger.log('Executing register user use case', { email: dto.email });

    // Validate user uniqueness
    await this.validateUserUniqueness(dto);

    // Get default role
    const defaultRole = await this.getDefaultRole();
    if (!defaultRole) {
      throw new InternalServerErrorException('Default role not found. Please contact system administrator.');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create user
    const userData = await this.userRepository.createUser(dto, hashedPassword, defaultRole.id);
    const user = User.fromPrisma(userData);

    this.logger.log('User registered successfully', { userId: user.id, email: user.email });

    return {
      user,
      message: 'User registered successfully. Please verify your email.',
    };
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
    this.logger.debug('Getting default role for new user registration');
    const defaultRole = await this.roleRepository.findDefaultRole();
    this.logger.debug('Default role found', { roleId: defaultRole?.id, roleName: defaultRole?.name });
    return defaultRole;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
} 