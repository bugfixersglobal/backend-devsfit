import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RoleLevel, ROLE_HIERARCHY } from '../constants/roles.constants';

export interface RoleValidationResult {
  isValid: boolean;
  message?: string;
  userLevel?: number;
  targetLevel?: number;
  canManage: boolean;
}

@Injectable()
export class RoleValidationService {
  private readonly logger = new Logger(RoleValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a user can manage a specific role
   */
  async canUserManageRole(userId: string, targetRoleId: string): Promise<RoleValidationResult> {
    try {
      // Get user's highest role level
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      if (!userRoles.length) {
        return {
          isValid: false,
          message: 'User has no roles assigned',
          canManage: false,
        };
      }

      const userLevel = Math.max(...userRoles.map(ur => ur.role.level || 0));

      // Get target role level
      const targetRole = await this.prisma.role.findUnique({
        where: { id: targetRoleId },
      });

      if (!targetRole) {
        return {
          isValid: false,
          message: 'Target role not found',
          canManage: false,
        };
      }

      const targetLevel = targetRole.level || 0;

      // Check hierarchy
      const canManage = this.canManageRoleByLevel(userLevel, targetLevel);

      return {
        isValid: true,
        userLevel,
        targetLevel,
        canManage,
        message: canManage 
          ? 'User can manage this role' 
          : 'User cannot manage this role - insufficient privileges',
      };
    } catch (error) {
      this.logger.error('Error validating role management:', error);
      return {
        isValid: false,
        message: 'Error validating role management',
        canManage: false,
      };
    }
  }

  /**
   * Check if a user can assign a specific role to another user
   */
  async canUserAssignRole(assignerId: string, assigneeId: string, roleId: string): Promise<RoleValidationResult> {
    try {
      // Get assigner's highest role level
      const assignerRoles = await this.prisma.userRole.findMany({
        where: { userId: assignerId },
        include: { role: true },
      });

      if (!assignerRoles.length) {
        return {
          isValid: false,
          message: 'Assigner has no roles assigned',
          canManage: false,
        };
      }

      const assignerLevel = Math.max(...assignerRoles.map(ur => ur.role.level || 0));

      // Get target role level
      const targetRole = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!targetRole) {
        return {
          isValid: false,
          message: 'Target role not found',
          canManage: false,
        };
      }

      const targetLevel = targetRole.level || 0;

      // Get assignee's current highest role level
      const assigneeRoles = await this.prisma.userRole.findMany({
        where: { userId: assigneeId },
        include: { role: true },
      });

      const assigneeLevel = assigneeRoles.length 
        ? Math.max(...assigneeRoles.map(ur => ur.role.level || 0))
        : 0;

      // Check if assigner can manage the target role level
      const canManageRole = this.canManageRoleByLevel(assignerLevel, targetLevel);

      // Check if assigner can manage the assignee's current level
      const canManageAssignee = this.canManageRoleByLevel(assignerLevel, assigneeLevel);

      const canAssign = canManageRole && canManageAssignee;

      return {
        isValid: true,
        userLevel: assignerLevel,
        targetLevel,
        canManage: canAssign,
        message: canAssign 
          ? 'User can assign this role' 
          : 'User cannot assign this role - insufficient privileges or cannot manage assignee',
      };
    } catch (error) {
      this.logger.error('Error validating role assignment:', error);
      return {
        isValid: false,
        message: 'Error validating role assignment',
        canManage: false,
      };
    }
  }

  /**
   * Check if a user can access a specific resource/action
   */
  async canUserAccessResource(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const userPermissions = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // Check for wildcard permissions
      for (const userRole of userPermissions) {
        for (const rolePermission of userRole.role.permissions) {
          const permission = rolePermission.permission;
          
          // Check for super admin permission
          if (permission.name === '*') {
            return true;
          }
          
          // Check for resource wildcard (e.g., user:*)
          if (permission.name === `${resource}:*`) {
            return true;
          }
          
          // Check for specific permission
          if (permission.name === `${resource}:${action}`) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking resource access:', error);
      return false;
    }
  }

  /**
   * Get user's role hierarchy information
   */
  async getUserRoleHierarchy(userId: string): Promise<{
    roles: Array<{ name: string; level: number; category: string }>;
    highestLevel: number;
    canManageRoles: string[];
  }> {
    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      const roles = userRoles.map(ur => ({
        name: ur.role.name,
        level: ur.role.level || 0,
        category: ur.role.category || 'UNKNOWN',
      }));

      const highestLevel = Math.max(...roles.map(r => r.level));

      // Get roles that this user can manage
      const canManageRoles = Object.entries(ROLE_HIERARCHY)
        .filter(([level]) => parseInt(level) < highestLevel)
        .flatMap(([, manageableLevels]) => manageableLevels)
        .map(level => level.toString());

      return {
        roles,
        highestLevel,
        canManageRoles: [...new Set(canManageRoles)],
      };
    } catch (error) {
      this.logger.error('Error getting user role hierarchy:', error);
      return {
        roles: [],
        highestLevel: 0,
        canManageRoles: [],
      };
    }
  }

  /**
   * Validate role hierarchy rules
   */
  private canManageRoleByLevel(userLevel: number, targetLevel: number): boolean {
    // Users can only manage roles with lower levels
    return userLevel > targetLevel;
  }

  /**
   * Check if role name follows professional naming convention
   */
  validateRoleName(roleName: string): { isValid: boolean; message?: string } {
    const validPattern = /^[A-Z_]+$/;
    
    if (!validPattern.test(roleName)) {
      return {
        isValid: false,
        message: 'Role name must be in UPPER_SNAKE_CASE format (e.g., SUPER_ADMIN, FACILITY_MANAGER)',
      };
    }

    if (roleName.length < 3 || roleName.length > 50) {
      return {
        isValid: false,
        message: 'Role name must be between 3 and 50 characters',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate role level assignment
   */
  validateRoleLevel(level: number): { isValid: boolean; message?: string } {
    if (level < 0 || level > 5) {
      return {
        isValid: false,
        message: 'Role level must be between 0 and 5',
      };
    }

    return { isValid: true };
  }
}
