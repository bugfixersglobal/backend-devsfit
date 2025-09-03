import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if user has super admin role
    const isSuperAdmin = this.checkSuperAdminRole(user);

    if (!isSuperAdmin) {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }

  private checkSuperAdminRole(user: any): boolean {
    // Check for super admin role in different formats
    if (user.roles) {
      // Array format: ['super_admin', 'admin']
      if (Array.isArray(user.roles)) {
        return user.roles.includes('super_admin') || user.roles.includes('SUPER_ADMIN');
      }
      
      // String format: 'super_admin'
      if (typeof user.roles === 'string') {
        return user.roles === 'super_admin' || user.roles === 'SUPER_ADMIN';
      }
    }

    // Check permissions
    if (user.permissions) {
      if (Array.isArray(user.permissions)) {
        return user.permissions.includes('saas_management') || 
               user.permissions.includes('super_admin_access') ||
               user.permissions.includes('package_management');
      }
    }

    // Check user type
    if (user.userType === 'super_admin' || user.type === 'super_admin') {
      return true;
    }

    // Check is admin flags
    if (user.isSuperAdmin === true || user.isAdmin === true) {
      return true;
    }

    return false;
  }
}