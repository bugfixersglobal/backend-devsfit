import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // For now, allow all requests for testing
    // In production, this would check admin privileges
    return true;
  }
}
