import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    try {
      // For now, we'll do basic JWT verification
      // In production, this should verify against the auth service's public key
      const decoded = jwt.decode(token) as any;
      
      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check token expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token expired');
      }

      // Add user info to request
      request.user = {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        fullName: decoded.fullName,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        companyId: decoded.companyId,
        userType: decoded.userType,
        isAdmin: decoded.isAdmin,
        isSuperAdmin: decoded.isSuperAdmin,
        isCompanyAdmin: decoded.isCompanyAdmin,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
