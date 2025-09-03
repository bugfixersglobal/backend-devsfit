import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
  Logger,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ModuleService } from '../services/module.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ModuleFiltersDto,
  AssignModuleToPackageDto,
  RemoveModuleFromPackageDto,
  AssignMultipleModulesDto,
  ModuleResponseDto,
  ModuleSummaryDto,
  ModuleStatisticsDto,
} from '../dto/module.dto';

@ApiTags('Super Admin - Module Management')
@Controller('admin/modules')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth('BearerAuth')
export class ModuleController {
  private readonly logger = new Logger(ModuleController.name);

  constructor(private readonly moduleService: ModuleService) {}

  // ===================
  // MODULE CRUD OPERATIONS
  // ===================

  @Get()
  @ApiOperation({ summary: 'Get all modules with optional filtering' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'updatedAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-100)', example: 10 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Items to skip (>=0)', example: 0 })
  @ApiResponse({ status: 200, description: 'Modules retrieved successfully', type: [ModuleResponseDto] })
  async getAllModules(@Query() filters: ModuleFiltersDto) {
    this.logger.log('Getting all modules', { filters });
    const modules = await this.moduleService.getAllModules(filters);
    return modules.map(module => module.toJSON());
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get module statistics and analytics' })
  @ApiResponse({ status: 200, description: 'Module statistics retrieved successfully', type: ModuleStatisticsDto })
  async getModuleStatistics() {
    this.logger.log('Getting module statistics');
    return this.moduleService.getModuleStatistics();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active modules' })
  @ApiResponse({ status: 200, description: 'Active modules retrieved successfully', type: [ModuleResponseDto] })
  async getActiveModules() {
    this.logger.log('Getting active modules');
    const modules = await this.moduleService.getActiveModules();
    return modules.map(module => module.toJSON());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific module details' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Module details retrieved successfully', type: ModuleResponseDto })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModuleById(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('Getting module by ID', { moduleId: id });
    const module = await this.moduleService.getModuleById(id);
    return module.toJSON();
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get module by name' })
  @ApiParam({ name: 'name', description: 'Module name' })
  @ApiResponse({ status: 200, description: 'Module details retrieved successfully', type: ModuleResponseDto })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModuleByName(@Param('name') name: string) {
    this.logger.log('Getting module by name', { name });
    const module = await this.moduleService.getModuleByName(name);
    return module.toJSON();
  }

  @Post()
  @ApiOperation({ summary: 'Create new module' })
  @ApiBody({ type: CreateModuleDto, description: 'Module data' })
  @ApiResponse({ status: 201, description: 'Module created successfully', type: ModuleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid module data' })
  @ApiResponse({ status: 409, description: 'Module name already exists' })
  async createModule(@Body() createModuleDto: CreateModuleDto) {
    this.logger.log('Creating new module', { 
      name: createModuleDto.name,
      icon: createModuleDto.icon 
    });
    
    try {
      // Add createdBy from JWT token (you'll need to implement this)
      const createdBy = 'John Doe'; // This should come from JWT token
      
      const moduleData = {
        ...createModuleDto,
        createdBy,
      };
      
      const module = await this.moduleService.createModule(moduleData);
      this.logger.log('Module created successfully', { 
        moduleId: module.id,
        name: module.name 
      });
      return module.toJSON();
    } catch (error) {
      this.logger.error('Failed to create module', { 
        error: error.message,
        moduleName: createModuleDto.name 
      });
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiBody({ type: UpdateModuleDto, description: 'Updated module data' })
  @ApiResponse({ status: 200, description: 'Module updated successfully', type: ModuleResponseDto })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    this.logger.log('Updating module', { moduleId: id });
    
    try {
      const module = await this.moduleService.updateModule(id, updateModuleDto);
      this.logger.log('Module updated successfully', { moduleId: id });
      return module.toJSON();
    } catch (error) {
      this.logger.error('Failed to update module', { 
        error: error.message,
        moduleId: id 
      });
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete module that is assigned to packages' })
  async deleteModule(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('Deleting module', { moduleId: id });
    
    try {
      await this.moduleService.deleteModule(id);
      this.logger.log('Module deleted successfully', { moduleId: id });
      return { message: 'Module deleted successfully' };
    } catch (error) {
      this.logger.error('Failed to delete module', { 
        error: error.message,
        moduleId: id 
      });
      throw error;
    }
  }

  // ===================
  // PACKAGE MODULE OPERATIONS
  // ===================

  @Get('packages/:packageId')
  @ApiOperation({ summary: 'Get modules assigned to a package' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package modules retrieved successfully', type: [ModuleResponseDto] })
  async getPackageModules(@Param('packageId', ParseUUIDPipe) packageId: string) {
    this.logger.log('Getting package modules', { packageId });
    const modules = await this.moduleService.getPackageModules(packageId);
    return modules.map(module => module.toJSON());
  }

  @Get('packages/:packageId/available')
  @ApiOperation({ summary: 'Get available modules for a package' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Available modules retrieved successfully', type: [ModuleResponseDto] })
  async getAvailableModulesForPackage(@Param('packageId', ParseUUIDPipe) packageId: string) {
    this.logger.log('Getting available modules for package', { packageId });
    const modules = await this.moduleService.getAvailableModulesForPackage(packageId);
    return modules.map(module => module.toJSON());
  }

  @Post('packages/:packageId/assign')
  @ApiOperation({ summary: 'Assign module to package' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  @ApiBody({ type: AssignModuleToPackageDto, description: 'Module assignment data' })
  @ApiResponse({ status: 200, description: 'Module assigned to package successfully' })
  @ApiResponse({ status: 404, description: 'Module or package not found' })
  async assignModuleToPackage(
    @Param('packageId', ParseUUIDPipe) packageId: string,
    @Body() assignModuleDto: AssignModuleToPackageDto,
  ) {
    this.logger.log('Assigning module to package', { 
      packageId, 
      moduleId: assignModuleDto.moduleId 
    });
    
    try {
      await this.moduleService.assignModuleToPackage(packageId, assignModuleDto);
      this.logger.log('Module assigned to package successfully', { 
        packageId, 
        moduleId: assignModuleDto.moduleId 
      });
      return { message: 'Module assigned to package successfully' };
    } catch (error) {
      this.logger.error('Failed to assign module to package', { 
        error: error.message,
        packageId, 
        moduleId: assignModuleDto.moduleId 
      });
      throw error;
    }
  }

  @Post('packages/:packageId/assign-multiple')
  @ApiOperation({ summary: 'Assign multiple modules to package' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  @ApiBody({ type: AssignMultipleModulesDto, description: 'Multiple module assignment data' })
  @ApiResponse({ status: 200, description: 'Modules assigned to package successfully' })
  @ApiResponse({ status: 404, description: 'One or more modules not found' })
  async assignMultipleModulesToPackage(
    @Param('packageId', ParseUUIDPipe) packageId: string,
    @Body() assignMultipleModulesDto: AssignMultipleModulesDto,
  ) {
    this.logger.log('Assigning multiple modules to package', { 
      packageId, 
      moduleCount: assignMultipleModulesDto.moduleIds.length 
    });
    
    try {
      await this.moduleService.assignMultipleModulesToPackage(packageId, assignMultipleModulesDto);
      this.logger.log('Multiple modules assigned to package successfully', { 
        packageId, 
        moduleCount: assignMultipleModulesDto.moduleIds.length 
      });
      return { message: 'Modules assigned to package successfully' };
    } catch (error) {
      this.logger.error('Failed to assign multiple modules to package', { 
        error: error.message,
        packageId 
      });
      throw error;
    }
  }

  @Delete('packages/:packageId/remove')
  @ApiOperation({ summary: 'Remove module from package' })
  @ApiParam({ name: 'packageId', description: 'Package ID' })
  @ApiBody({ type: RemoveModuleFromPackageDto, description: 'Module removal data' })
  @ApiResponse({ status: 200, description: 'Module removed from package successfully' })
  async removeModuleFromPackage(
    @Param('packageId', ParseUUIDPipe) packageId: string,
    @Body() removeModuleDto: RemoveModuleFromPackageDto,
  ) {
    this.logger.log('Removing module from package', { 
      packageId, 
      moduleId: removeModuleDto.moduleId 
    });
    
    try {
      await this.moduleService.removeModuleFromPackage(packageId, removeModuleDto);
      this.logger.log('Module removed from package successfully', { 
        packageId, 
        moduleId: removeModuleDto.moduleId 
      });
      return { message: 'Module removed from package successfully' };
    } catch (error) {
      this.logger.error('Failed to remove module from package', { 
        error: error.message,
        packageId, 
        moduleId: removeModuleDto.moduleId 
      });
      throw error;
    }
  }

  // ===================
  // CACHE MANAGEMENT
  // ===================

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear module cache' })
  @ApiResponse({ status: 200, description: 'Module cache cleared successfully' })
  async clearModuleCache() {
    this.logger.log('Clearing module cache');
    await this.moduleService.clearModuleCache();
    return { message: 'Module cache cleared successfully' };
  }
}
