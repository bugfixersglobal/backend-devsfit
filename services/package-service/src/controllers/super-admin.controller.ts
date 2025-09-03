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
  Logger 
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SuperAdminService } from '../services/super-admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { 
  CreatePackageDto, 
  UpdatePackageDto,
  SuperAdminCreateModuleDto,
  SuperAdminUpdateModuleDto,
  CompletePackageCreationDto
} from '../dto/super-admin.dto';

@ApiTags('Super Admin - Package Management')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth('BearerAuth')
export class SuperAdminController {
  private readonly logger = new Logger(SuperAdminController.name);

  constructor(
    private readonly superAdminService: SuperAdminService,
  ) {}

  // ===================
  // PACKAGE MANAGEMENT
  // ===================

  @Get('packages')
  @ApiOperation({ summary: 'Get all packages' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'DRAFT'] })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  async getAllPackages(@Query('status') status?: string) {
    this.logger.log('Super admin retrieving all packages', { status });
    return this.superAdminService.getAllPackages(status);
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async getPackageById(@Param('id') id: string) {
    this.logger.log('Super admin retrieving package', { id });
    return this.superAdminService.getPackageById(id);
  }

  @Post('packages')
  @ApiOperation({ summary: 'Create new package' })
  @ApiBody({ type: CreatePackageDto })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid package data' })
  async createPackage(@Body() createPackageDto: CreatePackageDto) {
    this.logger.log('Super admin creating package', { name: createPackageDto.name });
    return this.superAdminService.createPackage(createPackageDto);
  }

  @Post('packages/step-by-step')
  @ApiOperation({ summary: 'Create package step by step' })
  @ApiBody({ type: CompletePackageCreationDto })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid package data' })
  async createPackageStepByStep(@Body() completeDto: CompletePackageCreationDto) {
    this.logger.log('Super admin creating package step by step', { 
      name: completeDto.step2.name,
      packageType: completeDto.step1.packageType 
    });

    // Combine all steps into a single package creation request
    const createPackageDto = {
      name: completeDto.step2.name,
      description: completeDto.step2.description,
      packageType: completeDto.step1.packageType,
      isPopular: completeDto.step1.isPopular,
      maxMembers: completeDto.step2.maxMembers,
      unlimitedMembers: completeDto.step2.unlimitedMembers,
      billingCycles: completeDto.step3.billingCycles,
      selectedModules: completeDto.step4.selectedModules,
      additionalFeatures: completeDto.step5.additionalFeatures,
    };

    return this.superAdminService.createPackage(createPackageDto);
  }

  @Put('packages/:id')
  @ApiOperation({ summary: 'Update package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiBody({ type: UpdatePackageDto })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async updatePackage(
    @Param('id') id: string,
    @Body() updatePackageDto: UpdatePackageDto,
  ) {
    this.logger.log('Super admin updating package', { id });
    return this.superAdminService.updatePackage(id, updatePackageDto);
  }

  @Delete('packages/:id')
  @ApiOperation({ summary: 'Delete package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package deleted successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async deletePackage(@Param('id') id: string) {
    this.logger.log('Super admin deleting package', { id });
    await this.superAdminService.deletePackage(id);
    return { success: true, message: 'Package deleted successfully' };
  }

  // ===================
  // MODULE MANAGEMENT
  // ===================

  @Get('modules')
  @ApiOperation({ summary: 'Get all modules' })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Modules retrieved successfully' })
  async getAllModules(@Query('category') category?: string) {
    this.logger.log('Super admin retrieving modules', { category });
    if (category) {
      return this.superAdminService.getAllModules(category);
    }
    return this.superAdminService.getAvailableModulesForPackageCreation();
  }

  @Post('modules')
  @ApiOperation({ summary: 'Create new module' })
  @ApiBody({ type: SuperAdminCreateModuleDto })
  @ApiResponse({ status: 201, description: 'Module created successfully' })
  async createModule(@Body() createModuleDto: SuperAdminCreateModuleDto) {
    this.logger.log('Super admin creating module', { name: createModuleDto.name });
    try {
      // Add createdBy from JWT token (you'll need to implement this)
      const createdBy = '00000000-0000-0000-0000-000000000000'; // This should come from JWT token
      
      const moduleData = {
        ...createModuleDto,
        createdBy,
      };
      
      const module = await this.superAdminService.createModule(moduleData);
      return {
        success: true,
        data: module,
        message: 'Module created successfully',
      };
    } catch (error) {
      this.logger.error('Module creation failed', { error: error.message });
      throw error;
    }
  }

  @Put('modules/:id')
  @ApiOperation({ summary: 'Update module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiBody({ type: SuperAdminUpdateModuleDto })
  @ApiResponse({ status: 200, description: 'Module updated successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async updateModule(
    @Param('id') id: string,
    @Body() updateModuleDto: SuperAdminUpdateModuleDto,
  ) {
    this.logger.log('Super admin updating module', { id });
    return this.superAdminService.updateModule(id, updateModuleDto);
  }

  @Delete('modules/:id')
  @ApiOperation({ summary: 'Delete module' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({ status: 200, description: 'Module deleted successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async deleteModule(@Param('id') id: string) {
    this.logger.log('Super admin deleting module', { id });
    await this.superAdminService.deleteModule(id);
    return { success: true, message: 'Module deleted successfully' };
  }
}
