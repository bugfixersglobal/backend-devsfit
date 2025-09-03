import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // For now, skip JWT validation to test the service
    // In production, this would validate JWT tokens
    return true;
  }
}
