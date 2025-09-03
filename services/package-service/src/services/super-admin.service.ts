import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { 
  PackageEntity, 
  CreatePackageEntity, 
  UpdatePackageEntity,
  ModuleEntity,
  CreateModuleEntity,
  UpdateModuleEntity
} from '../entities/saas-package.entity';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===================
  // PACKAGE MANAGEMENT
  // ===================

  async getAllPackages(status?: string): Promise<PackageEntity[]> {
    this.logger.log('Getting all packages', { status });
    
    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const packages = await this.prisma.package.findMany({
      where,
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return packages.map(pkg => this.mapPackageToEntity(pkg));
  }

  async getPackageById(id: string): Promise<PackageEntity> {
    this.logger.log('Getting package by ID', { id });

    const package_ = await this.prisma.package.findUnique({
      where: { id },
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      }
    });

    if (!package_) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return this.mapPackageToEntity(package_);
  }

  async createPackage(createPackageDto: CreatePackageEntity): Promise<PackageEntity> {
    this.logger.log('Creating package', { name: createPackageDto.name });

    // Validate that package name is unique
    const existingPackage = await this.prisma.package.findUnique({
      where: { name: createPackageDto.name }
    });

    if (existingPackage) {
      throw new BadRequestException(`Package with name "${createPackageDto.name}" already exists`);
    }

    // Validate modules exist
    if (createPackageDto.selectedModules.length > 0) {
      const modules = await this.prisma.module.findMany({
        where: {
          id: { in: createPackageDto.selectedModules }
        }
      });

      if (modules.length !== createPackageDto.selectedModules.length) {
        throw new BadRequestException('Some modules not found');
      }
    }

    const package_ = await this.prisma.package.create({
      data: {
        name: createPackageDto.name,
        description: createPackageDto.description,
        packageType: createPackageDto.packageType,
        isPopular: createPackageDto.isPopular,
        maxMembers: createPackageDto.unlimitedMembers ? null : createPackageDto.maxMembers,
        unlimitedMembers: createPackageDto.unlimitedMembers,
        additionalFeatures: createPackageDto.additionalFeatures,
        billingCycles: {
          create: createPackageDto.billingCycles.map(cycle => ({
            months: cycle.months,
            price: cycle.price,
            discount: cycle.discount
          }))
        },
        modules: {
          create: createPackageDto.selectedModules.map(moduleId => ({
            moduleId,
            isEnabled: true
          }))
        }
      },
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      }
    });

    return this.mapPackageToEntity(package_);
  }

  async updatePackage(id: string, updatePackageDto: UpdatePackageEntity): Promise<PackageEntity> {
    this.logger.log('Updating package', { id });

    const existingPackage = await this.prisma.package.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    // Validate that package name is unique if being updated
    if (updatePackageDto.name && updatePackageDto.name !== existingPackage.name) {
      const nameExists = await this.prisma.package.findUnique({
        where: { name: updatePackageDto.name }
      });

      if (nameExists) {
        throw new BadRequestException(`Package with name "${updatePackageDto.name}" already exists`);
      }
    }

    // Update package
    const updatedPackage = await this.prisma.package.update({
      where: { id },
      data: {
        name: updatePackageDto.name,
        description: updatePackageDto.description,
        packageType: updatePackageDto.packageType,
        isPopular: updatePackageDto.isPopular,
        maxMembers: updatePackageDto.unlimitedMembers ? null : updatePackageDto.maxMembers,
        unlimitedMembers: updatePackageDto.unlimitedMembers,
        additionalFeatures: updatePackageDto.additionalFeatures,
      },
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      }
    });

    // Update billing cycles if provided
    if (updatePackageDto.billingCycles) {
      // Delete existing billing cycles
      await this.prisma.packageBillingCycle.deleteMany({
        where: { packageId: id }
      });

      // Create new billing cycles
      await this.prisma.packageBillingCycle.createMany({
        data: updatePackageDto.billingCycles.map(cycle => ({
          packageId: id,
          months: cycle.months,
          price: cycle.price,
          discount: cycle.discount
        }))
      });
    }

    // Update modules if provided
    if (updatePackageDto.selectedModules) {
      // Delete existing module associations
      await this.prisma.packageModule.deleteMany({
        where: { packageId: id }
      });

      // Create new module associations
      await this.prisma.packageModule.createMany({
        data: updatePackageDto.selectedModules.map(moduleId => ({
          packageId: id,
          moduleId,
          isEnabled: true
        }))
      });
    }

    // Get updated package with all relations
    const finalPackage = await this.prisma.package.findUnique({
      where: { id },
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      }
    });

    return this.mapPackageToEntity(finalPackage!);
  }

  async deletePackage(id: string): Promise<void> {
    this.logger.log('Deleting package', { id });

    const existingPackage = await this.prisma.package.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    await this.prisma.package.delete({
      where: { id }
    });
  }

  // ===================
  // MODULE MANAGEMENT
  // ===================

  async getAllModules(category?: string): Promise<ModuleEntity[]> {
    this.logger.log('Getting all modules', { category });

    const where: any = { isActive: true };

    const modules = await this.prisma.module.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
        name: 'asc'
      }
    });

    return modules.map(module => this.mapModuleToEntity(module));
  }

  async getAvailableModulesForPackageCreation(): Promise<ModuleEntity[]> {
    this.logger.log('Getting available modules for package creation');

    const modules = await this.prisma.module.findMany({
      where: { isActive: true },
      orderBy: {
        createdAt: 'asc',
        name: 'asc'
      }
    });

    return modules.map(module => this.mapModuleToEntity(module));
  }

  async createModule(createModuleDto: CreateModuleEntity): Promise<ModuleEntity> {
    this.logger.log('Creating module', { name: createModuleDto.name });

    // Validate that module name is unique
    const existingModule = await this.prisma.module.findUnique({
      where: { name: createModuleDto.name }
    });

    if (existingModule) {
      throw new BadRequestException(`Module with name "${createModuleDto.name}" already exists`);
    }

    const module = await this.prisma.module.create({
      data: {
        name: createModuleDto.name,
        icon: createModuleDto.icon,
        isActive: createModuleDto.isActive ?? true,
        createdBy: createModuleDto.createdBy
      }
    });

    return this.mapModuleToEntity(module);
  }

  async updateModule(id: string, updateModuleDto: UpdateModuleEntity): Promise<ModuleEntity> {
    this.logger.log('Updating module', { id });

    const existingModule = await this.prisma.module.findUnique({
      where: { id }
    });

    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    // Validate that module name is unique if being updated
    if (updateModuleDto.name && updateModuleDto.name !== existingModule.name) {
      const nameExists = await this.prisma.module.findUnique({
        where: { name: updateModuleDto.name }
      });

      if (nameExists) {
        throw new BadRequestException(`Module with name "${updateModuleDto.name}" already exists`);
      }
    }

    const module = await this.prisma.module.update({
      where: { id },
      data: {
        name: updateModuleDto.name,
        icon: updateModuleDto.icon,
        isActive: updateModuleDto.isActive
      }
    });

    return this.mapModuleToEntity(module);
  }

  async deleteModule(id: string): Promise<void> {
    this.logger.log('Deleting module', { id });

    const existingModule = await this.prisma.module.findUnique({
      where: { id }
    });

    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    // Check if module is used by any packages
    const packageModules = await this.prisma.packageModule.findMany({
      where: { moduleId: id }
    });

    if (packageModules.length > 0) {
      throw new BadRequestException(`Cannot delete module. It is used by ${packageModules.length} package(s)`);
    }

    await this.prisma.module.delete({
      where: { id }
    });
  }

  // ===================
  // UTILITY METHODS
  // ===================

  private mapPackageToEntity(pkg: any): PackageEntity {
    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      packageType: pkg.packageType,
      isPopular: pkg.isPopular,
      maxMembers: pkg.maxMembers,
      unlimitedMembers: pkg.unlimitedMembers,
      billingCycles: pkg.billingCycles.map((cycle: any) => ({
        id: cycle.id,
        packageId: cycle.packageId,
        months: cycle.months,
        price: Number(cycle.price),
        discount: cycle.discount,
        createdAt: cycle.createdAt
      })),
      modules: pkg.modules.map((pm: any) => ({
        id: pm.id,
        packageId: pm.packageId,
        moduleId: pm.moduleId,
        isEnabled: pm.isEnabled,
        createdAt: pm.createdAt,
        module: pm.module ? this.mapModuleToEntity(pm.module) : undefined
      })),
      additionalFeatures: pkg.additionalFeatures,
      status: pkg.status,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    };
  }

  private mapModuleToEntity(module: any): ModuleEntity {
    return {
      id: module.id,
      name: module.name,
      icon: module.icon,
      isActive: module.isActive,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      createdBy: module.createdBy
    };
  }

  // ===================
  // CACHE MANAGEMENT
  // ===================

  async clearPackageCache(): Promise<void> {
    this.logger.log('Clearing package cache');
    // Implement cache clearing logic if needed
  }

  async clearModuleCache(): Promise<void> {
    this.logger.log('Clearing module cache');
    // Implement cache clearing logic if needed
  }
}