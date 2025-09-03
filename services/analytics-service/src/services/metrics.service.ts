import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  constructor() {}

  async getServiceMetrics() {
    return {
      service: 'analytics-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
