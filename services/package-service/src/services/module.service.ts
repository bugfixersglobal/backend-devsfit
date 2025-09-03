import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ModuleRepository } from '../repositories/module.repository';
import { CacheService } from './cache.service';
import { Module } from '../entities/module.entity';
import { CreateModuleUseCase } from '../use-cases/create-module.use-case';
import { 
  ModuleFilters, 
  CreateModuleRequest, 
  UpdateModuleRequest,
  AssignModuleToPackageRequest,
  RemoveModuleFromPackageRequest,
  AssignMultipleModulesRequest,
} from '../types/module.types';

@Injectable()
export class ModuleService {
  private readonly logger = new Logger(ModuleService.name);

  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly createModuleUseCase: CreateModuleUseCase,
    private readonly cacheService: CacheService,
  ) {}

  // ===================
  // MODULE MANAGEMENT
  // ===================

  async getAllModules(filters: ModuleFilters = {}): Promise<Module[]> {
    this.logger.log('Getting all modules', { filters });
    return this.moduleRepository.findAll(filters);
  }

  async getModuleById(id: string): Promise<Module> {
    this.logger.log('Getting module by ID', { moduleId: id });
    
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundException(`Module with ID '${id}' not found`);
    }
    
    return module;
  }

  async getModuleByName(name: string): Promise<Module> {
    this.logger.log('Getting module by name', { name });
    
    const module = await this.moduleRepository.findByName(name);
    if (!module) {
      throw new NotFoundException(`Module with name '${name}' not found`);
    }
    
    return module;
  }

  async createModule(data: CreateModuleRequest): Promise<Module> {
    this.logger.log('Creating module', { name: data.name });
    
    try {
      const result = await this.createModuleUseCase.execute(data);
      this.logger.log('Module created successfully', { 
        moduleId: result.module.id,
        name: result.module.name 
      });
      return result.module;
    } catch (error) {
      this.logger.error('Failed to create module', { 
        error: error.message,
        moduleName: data.name 
      });
      throw error;
    }
  }

  async updateModule(id: string, data: UpdateModuleRequest): Promise<Module> {
    this.logger.log('Updating module', { moduleId: id });
    
    // Check if module exists
    await this.getModuleById(id);
    
    // Validate name if provided
    if (data.name !== undefined && !Module.validateName(data.name)) {
      throw new BadRequestException(
        'Module name must be 2-100 characters and may include letters, numbers, spaces, & and -'
      );
    }
    
    try {
      const module = await this.moduleRepository.update(id, data);
      this.logger.log('Module updated successfully', { moduleId: id });
      return module;
    } catch (error) {
      this.logger.error('Failed to update module', { 
        error: error.message,
        moduleId: id 
      });
      
      // Handle name conflict error
      if (error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      
      throw error;
    }
  }

  async deleteModule(id: string): Promise<void> {
    this.logger.log('Deleting module', { moduleId: id });
    
    // Check if module exists
    await this.getModuleById(id);
    
    // Check if module is used in any packages
    const isUsed = await this.isModuleUsedInPackages(id);
    if (isUsed) {
      throw new BadRequestException(
        'Cannot delete module that is currently assigned to packages. Remove it from all packages first.'
      );
    }
    
    try {
      await this.moduleRepository.delete(id);
      this.logger.log('Module deleted successfully', { moduleId: id });
    } catch (error) {
      this.logger.error('Failed to delete module', { 
        error: error.message,
        moduleId: id 
      });
      throw error;
    }
  }

  async getModuleStatistics(): Promise<any> {
    this.logger.log('Getting module statistics');
    return this.moduleRepository.getModuleStatistics();
  }

  // ===================
  // PACKAGE MODULE OPERATIONS
  // ===================

  async getPackageModules(packageId: string): Promise<Module[]> {
    this.logger.log('Getting package modules', { packageId });
    return this.moduleRepository.getPackageModules(packageId);
  }

  async getAvailableModulesForPackage(packageId: string): Promise<Module[]> {
    this.logger.log('Getting available modules for package', { packageId });
    return this.moduleRepository.getAvailableModulesForPackage(packageId);
  }

  async assignModuleToPackage(packageId: string, request: AssignModuleToPackageRequest): Promise<void> {
    this.logger.log('Assigning module to package', { 
      packageId, 
      moduleId: request.moduleId,
      isEnabled: request.isEnabled 
    });
    
    // Validate module exists
    await this.getModuleById(request.moduleId);
    
    try {
      await this.moduleRepository.assignToPackage(
        packageId, 
        request.moduleId, 
        request.isEnabled ?? true
      );
      this.logger.log('Module assigned to package successfully', { 
        packageId, 
        moduleId: request.moduleId 
      });
    } catch (error) {
      this.logger.error('Failed to assign module to package', { 
        error: error.message,
        packageId, 
        moduleId: request.moduleId 
      });
      throw error;
    }
  }

  async removeModuleFromPackage(packageId: string, request: RemoveModuleFromPackageRequest): Promise<void> {
    this.logger.log('Removing module from package', { 
      packageId, 
      moduleId: request.moduleId 
    });
    
    try {
      await this.moduleRepository.removeFromPackage(packageId, request.moduleId);
      this.logger.log('Module removed from package successfully', { 
        packageId, 
        moduleId: request.moduleId 
      });
    } catch (error) {
      this.logger.error('Failed to remove module from package', { 
        error: error.message,
        packageId, 
        moduleId: request.moduleId 
      });
      throw error;
    }
  }

  async assignMultipleModulesToPackage(packageId: string, request: AssignMultipleModulesRequest): Promise<void> {
    this.logger.log('Assigning multiple modules to package', { 
      packageId, 
      moduleCount: request.moduleIds.length,
      isEnabled: request.isEnabled 
    });
    
    // Validate all modules exist
    for (const moduleId of request.moduleIds) {
      await this.getModuleById(moduleId);
    }
    
    try {
      // Assign modules in parallel
      await Promise.all(
        request.moduleIds.map(moduleId =>
          this.moduleRepository.assignToPackage(
            packageId, 
            moduleId, 
            request.isEnabled ?? true
          )
        )
      );
      
      this.logger.log('Multiple modules assigned to package successfully', { 
        packageId, 
        moduleCount: request.moduleIds.length 
      });
    } catch (error) {
      this.logger.error('Failed to assign multiple modules to package', { 
        error: error.message,
        packageId 
      });
      throw error;
    }
  }

  // ===================
  // UTILITY METHODS
  // ===================

  private async isModuleUsedInPackages(moduleId: string): Promise<boolean> {
    // This would need to be implemented in the repository
    // For now, we'll assume it's not used to allow deletion
    return false;
  }

  async clearModuleCache(): Promise<void> {
    this.logger.log('Clearing module cache');
    await this.moduleRepository.clearAllCache();
  }

  async getActiveModules(): Promise<Module[]> {
    this.logger.log('Getting active modules');
    return this.moduleRepository.findAll({ isActive: true });
  }
}
