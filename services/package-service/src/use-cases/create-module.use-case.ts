import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { ModuleRepository } from '../repositories/module.repository';
import { Module } from '../entities/module.entity';
import { CreateModuleRequest } from '../types/module.types';

export interface CreateModuleResult {
  module: Module;
  message: string;
}

@Injectable()
export class CreateModuleUseCase {
  private readonly logger = new Logger(CreateModuleUseCase.name);

  constructor(private readonly moduleRepository: ModuleRepository) {}

  async execute(request: CreateModuleRequest): Promise<CreateModuleResult> {
    this.logger.log('Executing create module use case', { 
      name: request.name,
      icon: request.icon 
    });

    // Validate business rules
    await this.validateRequest(request);

    // Check for existing module with same name
    const existingModule = await this.moduleRepository.findByName(request.name);
    if (existingModule) {
      throw new ConflictException(`Module with name '${request.name}' already exists`);
    }

    // Create the module
    const module = await this.moduleRepository.create(request);

    this.logger.log('Module created successfully', { 
      moduleId: module.id, 
      name: module.name
    });

    return {
      module,
      message: 'Module created successfully',
    };
  }

  private async validateRequest(request: CreateModuleRequest): Promise<void> {
    // Validate module name format (human-readable)
    if (!Module.validateName(request.name)) {
      throw new BadRequestException(
        'Module name must be 2-100 characters and may include letters, numbers, spaces, & and -'
      );
    }

    // Validate icon
    if (!Module.validateIcon(request.icon)) {
      throw new BadRequestException(
        'Icon must be provided and must be 1-255 characters long'
      );
    }

    // Validate icon path format
    if (!this.isValidIconPath(request.icon)) {
      throw new BadRequestException(
        'Icon path must be a valid file path'
      );
    }

    this.logger.debug('Module request validation passed', { name: request.name });
  }

  private isValidIconPath(iconPath: string): boolean {
    // Basic validation for icon path
    const validExtensions = ['.svg', '.png', '.jpg', '.jpeg'];
    const hasValidExtension = validExtensions.some(ext => iconPath.toLowerCase().endsWith(ext));
    const hasValidPath = iconPath.startsWith('/') || iconPath.startsWith('./') || iconPath.startsWith('../');
    
    return hasValidExtension && hasValidPath && iconPath.length <= 255;
  }
}
