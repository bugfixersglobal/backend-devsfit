import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly metricsService: MetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics overview data' })
  async getAnalyticsOverview() {
    return {
      service: 'analytics-service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      message: 'Analytics service is running',
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get service metrics' })
  @ApiResponse({ status: 200, description: 'Service metrics data' })
  async getMetrics() {
    return await this.metricsService.getServiceMetrics();
  }
}
