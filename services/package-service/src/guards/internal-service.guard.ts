import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const serviceToken = request.headers['x-service-token'];
    const serviceId = request.headers['x-service-id'];
    
    // Expected service token from environment
    const expectedToken = this.configService.get<string>('INTERNAL_SERVICE_TOKEN');
    const allowedServices = this.configService.get<string>('ALLOWED_INTERNAL_SERVICES')?.split(',') || ['admin-service'];
    
    // Validate service token
    if (!serviceToken || serviceToken !== expectedToken) {
      throw new UnauthorizedException('Invalid service token');
    }
    
    // Validate service ID
    if (!serviceId || !allowedServices.includes(serviceId)) {
      throw new UnauthorizedException('Unauthorized service');
    }
    
    // Add service info to request for logging
    request.serviceInfo = {
      serviceId,
      timestamp: new Date().toISOString(),
    };
    
    return true;
  }
}
