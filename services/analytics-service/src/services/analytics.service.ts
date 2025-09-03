import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  constructor() {}

  async getHealth() {
    return {
      status: 'ok',
      service: 'analytics-service',
      timestamp: new Date().toISOString(),
    };
  }

  async getMetrics() {
    return {
      service: 'analytics-service',
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }
}
