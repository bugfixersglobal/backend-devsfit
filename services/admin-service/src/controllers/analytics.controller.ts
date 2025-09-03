import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Admin - Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('packages')
  @ApiOperation({ summary: 'Get package analytics' })
  @ApiResponse({ status: 200, description: 'Package analytics retrieved successfully' })
  async getPackageAnalytics() {
    this.logger.log('Admin retrieving package analytics');
    return this.analyticsService.getPackageAnalytics();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics() {
    this.logger.log('Admin retrieving revenue analytics');
    return this.analyticsService.getRevenueAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics() {
    this.logger.log('Admin retrieving user analytics');
    return this.analyticsService.getUserAnalytics();
  }
}
