import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaymentMonitoringService, PaymentMetrics, PaymentMonitoringData } from '../services/payment-monitoring.service';

@ApiTags('Payment Monitoring')
@Controller('payments/monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentMonitoringController {
  private readonly logger = new Logger(PaymentMonitoringController.name);

  constructor(
    private readonly monitoringService: PaymentMonitoringService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get payment metrics for monitoring dashboard' })
  @ApiResponse({ status: 200, description: 'Payment metrics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for metrics (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for metrics (ISO string)' })
  async getPaymentMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaymentMetrics> {
    this.logger.log('Fetching payment metrics', { startDate, endDate });

    const timeRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;

    return this.monitoringService.getPaymentMetrics(timeRange);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get detailed payment logs' })
  @ApiResponse({ status: 200, description: 'Payment logs retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['INITIATED', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT'] })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for logs (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for logs (ISO string)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of logs to return' })
  async getPaymentLogs(
    @Query('status') status?: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'TIMEOUT',
    @Query('userId') userId?: string,
    @Query('companyId') companyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ): Promise<PaymentMonitoringData[]> {
    this.logger.log('Fetching payment logs', { 
      status, 
      userId, 
      companyId, 
      startDate, 
      endDate, 
      limit 
    });

    const filters = {
      status,
      userId,
      companyId,
      timeRange: startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined,
      limit: limit ? parseInt(limit, 10) : undefined
    };

    return this.monitoringService.getPaymentLogs(filters);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get comprehensive payment monitoring report' })
  @ApiResponse({ status: 200, description: 'Payment monitoring report generated successfully' })
  async getMonitoringReport(): Promise<{
    summary: PaymentMetrics;
    recentFailures: PaymentMonitoringData[];
    topPerformingPackages: { packageId: string; successCount: number; totalAmount: number }[];
    alertsAndWarnings: string[];
    generatedAt: string;
  }> {
    this.logger.log('Generating payment monitoring report');

    const report = this.monitoringService.generateMonitoringReport();
    
    return {
      ...report,
      generatedAt: new Date().toISOString()
    };
  }

  @Get('health-check')
  @ApiOperation({ summary: 'Check payment system health' })
  @ApiResponse({ status: 200, description: 'Payment system health status' })
  async getPaymentHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: PaymentMetrics;
    issues: string[];
    recommendations: string[];
  }> {
    this.logger.log('Performing payment system health check');

    const metrics = this.monitoringService.getPaymentMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check success rate
    if (metrics.successRate < 80) {
      status = 'critical';
      issues.push(`Critical: Low success rate (${metrics.successRate.toFixed(1)}%)`);
      recommendations.push('Investigate payment gateway issues and recent failures');
    } else if (metrics.successRate < 95) {
      status = 'warning';
      issues.push(`Warning: Below optimal success rate (${metrics.successRate.toFixed(1)}%)`);
      recommendations.push('Monitor payment failures and optimize checkout flow');
    }

    // Check processing time
    if (metrics.averageProcessingTime > 15000) { // 15 seconds
      if (status !== 'critical') status = 'warning';
      issues.push(`Warning: High processing time (${(metrics.averageProcessingTime / 1000).toFixed(1)}s)`);
      recommendations.push('Optimize payment processing performance');
    }

    // Check recent transaction volume
    if (metrics.totalTransactions === 0) {
      if (status !== 'critical') status = 'warning';
      issues.push('Warning: No recent transactions');
      recommendations.push('Verify payment system is receiving transactions');
    }

    if (issues.length === 0) {
      issues.push('All payment systems operating normally');
      recommendations.push('Continue monitoring payment metrics');
    }

    return {
      status,
      metrics,
      issues,
      recommendations
    };
  }

  @Get('real-time-stats')
  @ApiOperation({ summary: 'Get real-time payment statistics' })
  @ApiResponse({ status: 200, description: 'Real-time payment statistics' })
  async getRealTimeStats(): Promise<{
    last24Hours: PaymentMetrics;
    lastHour: PaymentMetrics;
    currentHourTransactions: number;
    trendingPackages: string[];
    recentTransactions: PaymentMonitoringData[];
  }> {
    this.logger.log('Fetching real-time payment statistics');

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    const last24HoursMetrics = this.monitoringService.getPaymentMetrics({
      start: last24Hours,
      end: now
    });

    const lastHourMetrics = this.monitoringService.getPaymentMetrics({
      start: lastHour,
      end: now
    });

    const currentHourLogs = this.monitoringService.getPaymentLogs({
      timeRange: { start: currentHour, end: now }
    });

    const recentTransactions = this.monitoringService.getPaymentLogs({
      timeRange: { start: lastHour, end: now },
      limit: 10
    });

    // Get trending packages (most transactions in last hour)
    const packageCounts = new Map<string, number>();
    this.monitoringService.getPaymentLogs({
      timeRange: { start: lastHour, end: now },
      status: 'SUCCESS'
    }).forEach(log => {
      if (log.packageId) {
        packageCounts.set(log.packageId, (packageCounts.get(log.packageId) || 0) + 1);
      }
    });

    const trendingPackages = Array.from(packageCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([packageId]) => packageId);

    return {
      last24Hours: last24HoursMetrics,
      lastHour: lastHourMetrics,
      currentHourTransactions: currentHourLogs.length,
      trendingPackages,
      recentTransactions
    };
  }
}
