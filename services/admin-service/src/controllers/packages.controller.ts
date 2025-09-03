import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PackageService } from '../services/package.service';

@ApiTags('Admin - Packages')
@Controller('packages')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class PackagesController {
  private readonly logger = new Logger(PackagesController.name);

  constructor(
    private readonly packageService: PackageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all packages' })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  async getAllPackages() {
    this.logger.log('Admin retrieving all packages');
    return this.packageService.getAllPackages();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package retrieved successfully' })
  async getPackageById(@Param('id') id: string) {
    this.logger.log(`Admin retrieving package ${id}`);
    return this.packageService.getPackageById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new package' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  async createPackage(@Body() createPackageDto: any) {
    this.logger.log('Admin creating package');
    return this.packageService.createPackage(createPackageDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  async updatePackage(@Param('id') id: string, @Body() updatePackageDto: any) {
    this.logger.log(`Admin updating package ${id}`);
    return this.packageService.updatePackage(id, updatePackageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package deleted successfully' })
  async deletePackage(@Param('id') id: string) {
    this.logger.log(`Admin deleting package ${id}`);
    await this.packageService.deletePackage(id);
    return { success: true, message: 'Package deleted successfully' };
  }
}
