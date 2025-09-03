import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { CacheService } from '../services/cache.service';
import { Module } from '../entities/module.entity';
import { ModuleFilters, CreateModuleRequest, UpdateModuleRequest } from '../types/module.types';

@Injectable()
export class ModuleRepository {
  private readonly logger = new Logger(ModuleRepository.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'module';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  // ===================
  // CRUD OPERATIONS
  // ===================

  async create(data: CreateModuleRequest): Promise<Module> {
    this.logger.debug('Creating module', { name: data.name });

    const moduleData = await this.prisma.module.create({
      data: {
        name: data.name,
        icon: data.icon,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
      },
    });

    const module = Module.fromPrisma(moduleData);
    
    // Invalidate cache
    await this.invalidateModuleCache();
    
    this.logger.log('Module created successfully', { moduleId: module.id, name: module.name });
    return module;
  }

  async findById(id: string): Promise<Module | null> {
    this.logger.debug('Finding module by ID', { moduleId: id });

    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      const moduleData = JSON.parse(cached as string);
      return Module.fromPrisma(moduleData);
    }

    // Database query
    const moduleData = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!moduleData) {
      return null;
    }

    const module = Module.fromPrisma(moduleData);
    
    // Cache the result (store as JSON string)
    await this.cacheService.set(cacheKey, JSON.stringify(moduleData), this.CACHE_TTL);
    
    return module;
  }

  async findByName(name: string): Promise<Module | null> {
    this.logger.debug('Finding module by name', { name });

    const moduleData = await this.prisma.module.findUnique({
      where: { name },
    });

    return moduleData ? Module.fromPrisma(moduleData) : null;
  }

  async findAll(filters: ModuleFilters = {}): Promise<Module[]> {
    this.logger.debug('Finding all modules', { filters });

    // Try cache first for common queries
    const cacheKey = this.buildCacheKey('list', filters);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      const modulesData = JSON.parse(cached as string);
      return modulesData.map((data: any) => Module.fromPrisma(data));
    }

        // Build query
    const where: any = {};
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'asc';
    }

    const modulesData = await this.prisma.module.findMany({
      where,
      orderBy,
      take: filters.limit,
      skip: filters.offset,
    });

    const modules = modulesData.map((data) => Module.fromPrisma(data));
    
    // Cache the result (store as JSON string)
    await this.cacheService.set(cacheKey, JSON.stringify(modulesData), this.CACHE_TTL);
    
    return modules;
  }

  async update(id: string, data: UpdateModuleRequest): Promise<Module> {
    this.logger.debug('Updating module', { moduleId: id, updateData: data });

    // Check for name conflicts if name is being updated
    if (data.name) {
      const existingModule = await this.prisma.module.findFirst({
        where: {
          name: data.name,
          id: { not: id }, // Exclude current module from check
        },
      });

      if (existingModule) {
        throw new Error(`Module with name "${data.name}" already exists`);
      }
    }

    const moduleData = await this.prisma.module.update({
      where: { id },
      data,
    });

    const module = Module.fromPrisma(moduleData);
    
    // Invalidate cache
    await this.invalidateModuleCache(id);
    
    this.logger.log('Module updated successfully', { moduleId: id, updatedModule: module.toJSON() });
    return module;
  }

  async delete(id: string): Promise<void> {
    this.logger.debug('Deleting module', { moduleId: id });

    await this.prisma.module.delete({
      where: { id },
    });
    
    // Invalidate cache
    await this.invalidateModuleCache(id);
    
    this.logger.log('Module deleted successfully', { moduleId: id });
  }

  // ===================
  // PACKAGE MODULE OPERATIONS
  // ===================

  async assignToPackage(packageId: string, moduleId: string, isEnabled: boolean = true): Promise<void> {
    this.logger.debug('Assigning module to package', { packageId, moduleId, isEnabled });

    await this.prisma.packageModule.upsert({
      where: {
        packageId_moduleId: {
          packageId,
          moduleId,
        },
      },
      update: {
        isEnabled,
      },
      create: {
        packageId,
        moduleId,
        isEnabled,
      },
    });

    // Invalidate package cache
    await this.invalidatePackageModuleCache(packageId);
    
    this.logger.log('Module assigned to package successfully', { packageId, moduleId });
  }

  async removeFromPackage(packageId: string, moduleId: string): Promise<void> {
    this.logger.debug('Removing module from package', { packageId, moduleId });

    await this.prisma.packageModule.delete({
      where: {
        packageId_moduleId: {
          packageId,
          moduleId,
        },
      },
    });

    // Invalidate package cache
    await this.invalidatePackageModuleCache(packageId);
    
    this.logger.log('Module removed from package successfully', { packageId, moduleId });
  }

  async getPackageModules(packageId: string): Promise<Module[]> {
    this.logger.debug('Getting package modules', { packageId });

    // Try cache first
    const cacheKey = `package:${packageId}:modules`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      const modulesData = JSON.parse(cached as string);
      return modulesData.map((data: any) => Module.fromPrisma(data));
    }

    const packageModulesData = await this.prisma.packageModule.findMany({
      where: { packageId },
      include: {
        module: true,
      },
      orderBy: {
        module: {
          createdAt: 'asc',
        },
      },
    });

    const modules = packageModulesData.map((pm) => Module.fromPrisma(pm.module));
    
    // Cache the result (store as JSON string)
    await this.cacheService.set(cacheKey, JSON.stringify(modules), this.CACHE_TTL);
    
    return modules;
  }

  async getAvailableModulesForPackage(packageId: string): Promise<Module[]> {
    this.logger.debug('Getting available modules for package', { packageId });

    // Get all active modules
    const allModules = await this.findAll({ isActive: true });
    
    // Get already assigned modules
    const assignedModules = await this.getPackageModules(packageId);
    const assignedModuleIds = new Set(assignedModules.map(m => m.id));
    
    // Return modules not yet assigned
    return allModules.filter(module => !assignedModuleIds.has(module.id));
  }

  // ===================
  // STATISTICS & ANALYTICS
  // ===================

  async getModuleStatistics(): Promise<any> {
    this.logger.debug('Getting module statistics');

    const cacheKey = `${this.CACHE_PREFIX}:statistics`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    const [totalModules, activeModules, mostUsedModules] = await Promise.all([
      this.prisma.module.count(),
      this.prisma.module.count({ where: { isActive: true } }),
      this.prisma.packageModule.groupBy({
        by: ['moduleId'],
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const statistics = {
      totalModules,
      activeModules,
      inactiveModules: totalModules - activeModules,
      mostUsedModules: await Promise.all(
        mostUsedModules.map(async (item) => {
          const module = await this.findById(item.moduleId);
          return {
            moduleId: item.moduleId,
            moduleName: module?.name || 'Unknown',
            usageCount: item._count.id,
          };
        })
      ),
    };

    // Cache the result (store as JSON string)
    await this.cacheService.set(cacheKey, JSON.stringify(statistics), this.CACHE_TTL);
    
    return statistics;
  }

  // ===================
  // CACHE MANAGEMENT
  // ===================

  private buildCacheKey(prefix: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    return `${this.CACHE_PREFIX}:${prefix}:${Buffer.from(filterString).toString('base64')}`;
  }

  private async invalidateModuleCache(moduleId?: string): Promise<void> {
    if (moduleId) {
      await this.cacheService.delete(`${this.CACHE_PREFIX}:${moduleId}`);
      this.logger.debug(`Invalidated individual module cache for: ${moduleId}`);
    }
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:list:*`);
    await this.cacheService.delete(`${this.CACHE_PREFIX}:statistics`);
    this.logger.debug('Invalidated all module list and statistics cache');
  }

  private async invalidatePackageModuleCache(packageId: string): Promise<void> {
    await this.cacheService.delete(`package:${packageId}:modules`);
  }

  async clearAllCache(): Promise<void> {
    this.logger.debug('Clearing all module cache');
    await this.cacheService.deletePattern(`${this.CACHE_PREFIX}:*`);
    await this.cacheService.deletePattern('package:*:modules');
  }
}
