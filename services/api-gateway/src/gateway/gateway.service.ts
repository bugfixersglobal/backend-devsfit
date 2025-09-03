import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import axios, { AxiosResponse } from 'axios';

interface ServiceRoute {
  path: string;
  service: string;
  url: string;
  requiresAuth?: boolean;
}

@Injectable()
export class GatewayService {
  private readonly routes: ServiceRoute[] = [
    // Auth Service
    { path: '/auth', service: 'auth-service', url: 'http://auth-service:3020', requiresAuth: false },
    
    // User Service
    { path: '/users', service: 'user-service', url: 'http://user-service:3002', requiresAuth: true },
    
    // Package Service
    { path: '/packages', service: 'package-service', url: 'http://package-service:3003', requiresAuth: true },
    
    // Billing Service
    { path: '/billing', service: 'billing-service', url: 'http://billing-service:3004', requiresAuth: true },
    
    // Payment Service
    { path: '/payments', service: 'payment-service', url: 'http://payment-service:3005', requiresAuth: true },
    
    // Company Service
    { path: '/companies', service: 'company-service', url: 'http://company-service:3030', requiresAuth: true },
    
    // Onboarding Service
    { path: '/onboarding', service: 'onboarding-service', url: 'http://onboarding-service:3007', requiresAuth: false },
    
    // File Service
    { path: '/files', service: 'file-service', url: 'http://file-service:3008', requiresAuth: true },
    
    // Analytics Service
    { path: '/analytics', service: 'analytics-service', url: 'http://analytics-service:3011', requiresAuth: true },
    
    // Attendance Service
    { path: '/attendance', service: 'attendance-service', url: 'http://attendance-service:3009', requiresAuth: true },
    
    // Report Service
    { path: '/reports', service: 'report-service', url: 'http://report-service:3010', requiresAuth: true },
    
    // Admin Service
    { path: '/admin', service: 'admin-service', url: 'http://admin-service:3001', requiresAuth: true },
    
    // Subscription Service
    { path: '/subscriptions', service: 'subscription-service', url: 'http://subscription-service:3006', requiresAuth: true },
  ];

  constructor(private readonly configService: ConfigService) {}

  async routeRequest(req: Request): Promise<{ status: number; data: any; headers?: any }> {
    const path = req.path;
    const route = this.findRoute(path);

    if (!route) {
      throw new HttpException('Route not found', HttpStatus.NOT_FOUND);
    }

    // Check authentication if required
    if (route.requiresAuth && !this.isAuthenticated(req)) {
      throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Build target URL
    const targetPath = path.replace(route.path, '');
    const targetUrl = `${route.url}/api/v1${targetPath}`;

    try {
      // Forward request
      const response: AxiosResponse = await axios({
        method: req.method as any,
        url: targetUrl,
        data: req.body,
        headers: this.buildHeaders(req),
        timeout: 30000,
        validateStatus: () => true, // Don't throw on HTTP error status
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      throw new HttpException(
        `Service ${route.service} unavailable`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  private findRoute(path: string): ServiceRoute | null {
    return this.routes.find(route => path.startsWith(route.path)) || null;
  }

  private isAuthenticated(req: Request): boolean {
    const authHeader = req.headers.authorization;
    return !!(authHeader && authHeader.startsWith('Bearer '));
  }

  private buildHeaders(req: Request): any {
    const headers = { ...req.headers };
    
    // Remove hop-by-hop headers
    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;
    
    // Add internal service headers
    headers['x-forwarded-for'] = req.ip;
    headers['x-forwarded-proto'] = req.protocol;
    headers['x-gateway'] = 'devsfit-api-gateway';

    return headers;
  }
}
