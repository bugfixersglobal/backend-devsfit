import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Admin - Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getDashboardAnalytics() {
    this.logger.log('Admin requesting dashboard analytics');
    return this.analyticsService.getDashboardAnalytics();
  }
}
