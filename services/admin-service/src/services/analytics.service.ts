import { Injectable, Logger } from '@nestjs/common';
import { MicroserviceClientService } from './microservice-client.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly microserviceClient: MicroserviceClientService,
  ) {}

  async getDashboardAnalytics() {
    this.logger.log('Aggregating dashboard analytics');
    
    try {
      const [packageAnalytics, revenueAnalytics, userAnalytics] = await Promise.all([
        this.getPackageAnalytics(),
        this.getRevenueAnalytics(), 
        this.getUserAnalytics(),
      ]);

      return {
        packages: packageAnalytics,
        revenue: revenueAnalytics,
        users: userAnalytics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to aggregate dashboard analytics', error);
      throw error;
    }
  }

  async getPackageAnalytics() {
    this.logger.log('Fetching package analytics');
    return this.microserviceClient.getPackageAnalytics();
  }

  async getRevenueAnalytics() {
    this.logger.log('Fetching revenue analytics');
    return this.microserviceClient.getRevenueAnalytics();
  }

  async getUserAnalytics() {
    this.logger.log('Fetching user analytics');
    return this.microserviceClient.getUserAnalytics();
  }
}
