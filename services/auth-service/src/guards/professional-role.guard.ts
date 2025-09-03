import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleValidationService } from '../services/role-validation.service';
import { RequestUser } from '../types/user.types';

export interface RoleGuardOptions {
  requireRole?: string[];
  requireLevel?: number;
  requireCategory?: string[];
  checkHierarchy?: boolean;
}

@Injectable()
export class ProfessionalRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleValidationService: RoleValidationService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Get role requirements from decorator
    const roleOptions = this.reflector.getAllAndOverride<RoleGuardOptions>('roleOptions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roleOptions) {
      return true; // No role requirements
    }

    return this.validateUserRoles(user, roleOptions);
  }

  private async validateUserRoles(user: RequestUser, options: RoleGuardOptions): Promise<boolean> {
    try {
      const userHierarchy = await this.roleValidationService.getUserRoleHierarchy(user.id);

      // Check required role names
      if (options.requireRole && options.requireRole.length > 0) {
        const hasRequiredRole = userHierarchy.roles.some(role => 
          options.requireRole!.includes(role.name)
        );
        
        if (!hasRequiredRole) {
          throw new ForbiddenException(
            `Required roles: ${options.requireRole.join(', ')}. User roles: ${userHierarchy.roles.map(r => r.name).join(', ')}`
          );
        }
      }

      // Check required level
      if (options.requireLevel !== undefined) {
        if (userHierarchy.highestLevel < options.requireLevel) {
          throw new ForbiddenException(
            `Required level: ${options.requireLevel}. User's highest level: ${userHierarchy.highestLevel}`
          );
        }
      }

      // Check required category
      if (options.requireCategory && options.requireCategory.length > 0) {
        const hasRequiredCategory = userHierarchy.roles.some(role => 
          options.requireCategory!.includes(role.category)
        );
        
        if (!hasRequiredCategory) {
          throw new ForbiddenException(
            `Required categories: ${options.requireCategory.join(', ')}. User categories: ${userHierarchy.roles.map(r => r.category).join(', ')}`
          );
        }
      }

      // Check hierarchy if enabled
      if (options.checkHierarchy) {
        // This would be used for operations that require hierarchy validation
        // For example, ensuring a manager can only manage their subordinates
        // Implementation would depend on specific business logic
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Role validation failed');
    }
  }
}

// Decorator for role requirements
export const RequireRoles = (options: RoleGuardOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('roleOptions', options, descriptor.value);
    return descriptor;
  };
};

// Convenience decorators for common role checks
export const RequireSuperAdmin = () => RequireRoles({ requireRole: ['SUPER_ADMIN'] });
export const RequireAdmin = () => RequireRoles({ requireLevel: 4 }); // ADMIN level and above
export const RequireManager = () => RequireRoles({ requireLevel: 3 }); // MANAGER level and above
export const RequireStaff = () => RequireRoles({ requireLevel: 2 }); // STAFF level and above
export const RequirePlatformRole = () => RequireRoles({ requireCategory: ['PLATFORM_ROLES'] });
export const RequireBusinessRole = () => RequireRoles({ requireCategory: ['BUSINESS_ROLES'] });
export const RequireStaffRole = () => RequireRoles({ requireCategory: ['STAFF_ROLES'] });
