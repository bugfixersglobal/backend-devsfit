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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { PackageService } from '../services/package.service';
import { UserService } from '../services/user.service';
import { BillingService } from '../services/billing.service';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Admin - Management')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly packageService: PackageService,
    private readonly userService: UserService,
    private readonly billingService: BillingService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ===================
  // PACKAGES MANAGEMENT
  // ===================

  @Get('packages')
  @ApiOperation({ summary: 'Get all packages' })
  @ApiResponse({ status: 200, description: 'Packages retrieved successfully' })
  async getPackages() {
    this.logger.log('Admin retrieving all packages');
    return this.packageService.getAllPackages();
  }

  @Get('packages/:id')
  @ApiOperation({ summary: 'Get package by ID' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package retrieved successfully' })
  async getPackageById(@Param('id') id: string) {
    this.logger.log('Admin retrieving package', { id });
    return this.packageService.getPackageById(id);
  }

  @Post('packages')
  @ApiOperation({ summary: 'Create new package' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  async createPackage(@Body() createPackageDto: any) {
    this.logger.log('Admin creating package', { name: createPackageDto.name });
    return this.packageService.createPackage(createPackageDto);
  }

  @Put('packages/:id')
  @ApiOperation({ summary: 'Update package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  async updatePackage(@Param('id') id: string, @Body() updatePackageDto: any) {
    this.logger.log('Admin updating package', { id });
    return this.packageService.updatePackage(id, updatePackageDto);
  }

  @Delete('packages/:id')
  @ApiOperation({ summary: 'Delete package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Package deleted successfully' })
  async deletePackage(@Param('id') id: string) {
    this.logger.log('Admin deleting package', { id });
    await this.packageService.deletePackage(id);
    return { success: true, message: 'Package deleted successfully' };
  }

  @Get('modules')
  @ApiOperation({ summary: 'Get all modules' })
  @ApiResponse({ status: 200, description: 'Modules retrieved successfully' })
  async getModules() {
    this.logger.log('Admin retrieving all modules');
    return this.packageService.getAllModules();
  }

  @Post('packages/:id/modules')
  @ApiOperation({ summary: 'Assign modules to package' })
  @ApiParam({ name: 'id', description: 'Package ID' })
  @ApiResponse({ status: 200, description: 'Modules assigned successfully' })
  async assignModulesToPackage(
    @Param('id') packageId: string,
    @Body() body: { moduleIds: string[] }
  ) {
    this.logger.log('Admin assigning modules to package', { packageId, moduleIds: body.moduleIds });
    return this.packageService.assignModulesToPackage(packageId, body.moduleIds);
  }

  // ===================
  // USER MANAGEMENT
  // ===================

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    this.logger.log('Admin retrieving users', { status, role });
    return this.userService.getAllUsers({ status, role });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: string) {
    this.logger.log('Admin retrieving user', { id });
    return this.userService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: any) {
    this.logger.log('Admin updating user', { id });
    return this.userService.updateUser(id, updateUserDto);
  }

  @Post('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  async deactivateUser(@Param('id') id: string) {
    this.logger.log('Admin deactivating user', { id });
    return this.userService.deactivateUser(id);
  }

  // ===================
  // BILLING MANAGEMENT
  // ===================

  @Get('billing/transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Admin retrieving transactions', { status, startDate, endDate });
    return this.billingService.getAllTransactions({ status, startDate, endDate });
  }

  @Get('billing/invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getInvoices(@Query('status') status?: string) {
    this.logger.log('Admin retrieving invoices', { status });
    return this.billingService.getAllInvoices({ status });
  }

  // ===================
  // ANALYTICS
  // ===================

  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getDashboardAnalytics() {
    this.logger.log('Admin retrieving dashboard analytics');
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get('analytics/packages')
  @ApiOperation({ summary: 'Get package analytics' })
  @ApiResponse({ status: 200, description: 'Package analytics retrieved successfully' })
  async getPackageAnalytics() {
    this.logger.log('Admin retrieving package analytics');
    return this.analyticsService.getPackageAnalytics();
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics() {
    this.logger.log('Admin retrieving revenue analytics');
    return this.analyticsService.getRevenueAnalytics();
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics() {
    this.logger.log('Admin retrieving user analytics');
    return this.analyticsService.getUserAnalytics();
  }
}
