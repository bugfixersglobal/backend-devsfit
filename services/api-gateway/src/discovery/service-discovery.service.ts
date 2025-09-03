import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  healthy: boolean;
  lastCheck: Date;
}

@Injectable()
export class ServiceDiscoveryService {
  private readonly logger = new Logger(ServiceDiscoveryService.name);
  private readonly services = new Map<string, ServiceInstance[]>();
  private readonly healthCheckInterval = 30000; // 30 seconds

  constructor(private readonly configService: ConfigService) {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices() {
    // Register known services
    const serviceConfigs = [
      { name: 'auth-service', host: 'auth-service', port: 3020 },
      { name: 'user-service', host: 'user-service', port: 3002 },
      { name: 'package-service', host: 'package-service', port: 3003 },
      { name: 'billing-service', host: 'billing-service', port: 3004 },
      { name: 'payment-service', host: 'payment-service', port: 3005 },
      { name: 'company-service', host: 'company-service', port: 3030 },
      { name: 'onboarding-service', host: 'onboarding-service', port: 3007 },
    ];

    serviceConfigs.forEach(config => {
      const instance: ServiceInstance = {
        id: `${config.name}-1`,
        name: config.name,
        host: config.host,
        port: config.port,
        healthy: false,
        lastCheck: new Date(),
      };

      this.services.set(config.name, [instance]);
    });
  }

  getHealthyInstance(serviceName: string): ServiceInstance | null {
    const instances = this.services.get(serviceName) || [];
    const healthyInstances = instances.filter(instance => instance.healthy);
    
    if (healthyInstances.length === 0) {
      return null;
    }

    // Simple round-robin load balancing
    const randomIndex = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[randomIndex];
  }

  getServiceUrl(serviceName: string): string | null {
    const instance = this.getHealthyInstance(serviceName);
    return instance ? `http://${instance.host}:${instance.port}` : null;
  }

  private startHealthChecks() {
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);

    // Initial health check
    setTimeout(() => this.performHealthChecks(), 5000);
  }

  private async performHealthChecks() {
    const promises: Promise<void>[] = [];

    this.services.forEach((instances, serviceName) => {
      instances.forEach(instance => {
        promises.push(this.checkInstanceHealth(instance));
      });
    });

    await Promise.allSettled(promises);
    this.logHealthStatus();
  }

  private async checkInstanceHealth(instance: ServiceInstance): Promise<void> {
    try {
      const response = await axios.get(
        `http://${instance.host}:${instance.port}/health`,
        { timeout: 5000 }
      );

      const wasHealthy = instance.healthy;
      instance.healthy = response.status === 200;
      instance.lastCheck = new Date();

      if (!wasHealthy && instance.healthy) {
        this.logger.log(`Service ${instance.name} is now healthy`);
      } else if (wasHealthy && !instance.healthy) {
        this.logger.warn(`Service ${instance.name} is now unhealthy`);
      }
    } catch (error) {
      const wasHealthy = instance.healthy;
      instance.healthy = false;
      instance.lastCheck = new Date();

      if (wasHealthy) {
        this.logger.warn(`Service ${instance.name} health check failed: ${error.message}`);
      }
    }
  }

  private logHealthStatus() {
    const status: Record<string, { healthy: number; total: number }> = {};

    this.services.forEach((instances, serviceName) => {
      const healthy = instances.filter(i => i.healthy).length;
      status[serviceName] = { healthy, total: instances.length };
    });

    this.logger.debug('Service health status:', status);
  }

  getServiceStats() {
    const stats: Record<string, any> = {};

    this.services.forEach((instances, serviceName) => {
      const healthy = instances.filter(i => i.healthy).length;
      const total = instances.length;
      
      stats[serviceName] = {
        healthy,
        total,
        healthyPercentage: total > 0 ? Math.round((healthy / total) * 100) : 0,
        instances: instances.map(i => ({
          id: i.id,
          host: i.host,
          port: i.port,
          healthy: i.healthy,
          lastCheck: i.lastCheck,
        })),
      };
    });

    return stats;
  }
}
