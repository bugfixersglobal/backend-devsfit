import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class MicroserviceClientService {
  private readonly logger = new Logger(MicroserviceClientService.name);
  private readonly serviceToken: string;
  private readonly serviceId = 'admin-service';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serviceToken = this.configService.get<string>('INTERNAL_SERVICE_TOKEN');
  }

  /**
   * Get service base URL from configuration
   */
  private getServiceUrl(serviceName: string): string {
    const baseUrl = this.configService.get<string>(`${serviceName.toUpperCase()}_SERVICE_URL`);
    if (!baseUrl) {
      throw new Error(`Service URL not configured for ${serviceName}`);
    }
    return baseUrl;
  }

  /**
   * Create headers for service-to-service communication
   */
  private createServiceHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-service-token': this.serviceToken,
      'x-service-id': this.serviceId,
    };
  }

  /**
   * Generic method to call any microservice
   */
  async callService<T = any>(
    serviceName: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    params?: any,
  ): Promise<T> {
    const baseUrl = this.getServiceUrl(serviceName);
    const url = `${baseUrl}/internal/admin${endpoint}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: this.createServiceHeaders(),
      ...(data && { data }),
      ...(params && { params }),
    };

    this.logger.log(`Calling ${serviceName}: ${method} ${url}`);

    try {
      const response = await firstValueFrom(this.httpService.request<T>(config));
      this.logger.log(`Successfully called ${serviceName}: ${method} ${endpoint}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to call ${serviceName}: ${method} ${endpoint}`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  // ===================
  // PACKAGE SERVICE
  // ===================

  async getPackages(): Promise<any[]> {
    return this.callService('package', '/packages');
  }

  async getPackageById(id: string): Promise<any> {
    return this.callService('package', `/packages/${id}`);
  }

  async createPackage(data: any): Promise<any> {
    return this.callService('package', '/packages', 'POST', data);
  }

  async updatePackage(id: string, data: any): Promise<any> {
    return this.callService('package', `/packages/${id}`, 'PUT', data);
  }

  async deletePackage(id: string): Promise<void> {
    return this.callService('package', `/packages/${id}`, 'DELETE');
  }

  async getModules(): Promise<any[]> {
    return this.callService('package', '/modules');
  }

  async assignModulesToPackage(packageId: string, moduleIds: string[]): Promise<any> {
    return this.callService('package', `/packages/${packageId}/modules`, 'POST', { moduleIds });
  }

  // ===================
  // USER SERVICE
  // ===================

  async getUsers(filters: any = {}): Promise<any[]> {
    return this.callService('user', '/users', 'GET', null, filters);
  }

  async getUserById(id: string): Promise<any> {
    return this.callService('user', `/users/${id}`);
  }

  async updateUser(id: string, data: any): Promise<any> {
    return this.callService('user', `/users/${id}`, 'PUT', data);
  }

  async deactivateUser(id: string): Promise<any> {
    return this.callService('user', `/users/${id}/deactivate`, 'POST');
  }

  // ===================
  // BILLING SERVICE
  // ===================

  async getBillingData(filters: any = {}): Promise<any> {
    return this.callService('billing', '/billing', 'GET', null, filters);
  }

  async getTransactions(filters: any = {}): Promise<any[]> {
    return this.callService('billing', '/transactions', 'GET', null, filters);
  }

  async getInvoices(filters: any = {}): Promise<any[]> {
    return this.callService('billing', '/invoices', 'GET', null, filters);
  }

  // ===================
  // SUBSCRIPTION SERVICE
  // ===================

  async getSubscriptions(filters: any = {}): Promise<any[]> {
    return this.callService('subscription', '/subscriptions', 'GET', null, filters);
  }

  async getSubscriptionById(id: string): Promise<any> {
    return this.callService('subscription', `/subscriptions/${id}`);
  }

  async updateSubscription(id: string, data: any): Promise<any> {
    return this.callService('subscription', `/subscriptions/${id}`, 'PUT', data);
  }

  // ===================
  // ANALYTICS (from multiple services)
  // ===================

  async getPackageAnalytics(): Promise<any> {
    return this.callService('package', '/analytics/packages');
  }

  async getRevenueAnalytics(): Promise<any> {
    return this.callService('billing', '/analytics/revenue');
  }

  async getUserAnalytics(): Promise<any> {
    return this.callService('user', '/analytics/users');
  }

  async getSubscriptionAnalytics(): Promise<any> {
    return this.callService('subscription', '/analytics/subscriptions');
  }
}
