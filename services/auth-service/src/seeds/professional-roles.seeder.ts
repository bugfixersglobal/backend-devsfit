import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { PROFESSIONAL_ROLES, ROLE_PERMISSIONS, RoleCategory, RoleLevel } from '../constants/roles.constants';

@Injectable()
export class ProfessionalRolesSeeder {
  private readonly logger = new Logger(ProfessionalRolesSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    try {
      this.logger.log('🌱 Seeding professional roles and permissions...');

      // Create permissions first
      const permissions = await this.createPermissions();

      // Create professional roles
      await this.createProfessionalRoles(permissions);

      this.logger.log('✅ Professional roles seeding completed!');
    } catch (error) {
      this.logger.error('❌ Professional roles seeding failed:', error);
      throw error;
    }
  }

  private async createPermissions(): Promise<Map<string, string>> {
    const permissionMap = new Map<string, string>();

    // Define all possible permissions
    const allPermissions = [
      // User permissions
      { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
      { name: 'user:read', description: 'Read users', resource: 'user', action: 'read' },
      { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
      { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },
      
      // Role permissions
      { name: 'role:create', description: 'Create roles', resource: 'role', action: 'create' },
      { name: 'role:read', description: 'Read roles', resource: 'role', action: 'read' },
      { name: 'role:update', description: 'Update roles', resource: 'role', action: 'update' },
      { name: 'role:delete', description: 'Delete roles', resource: 'role', action: 'delete' },
      
      // Permission permissions
      { name: 'permission:create', description: 'Create permissions', resource: 'permission', action: 'create' },
      { name: 'permission:read', description: 'Read permissions', resource: 'permission', action: 'read' },
      { name: 'permission:update', description: 'Update permissions', resource: 'permission', action: 'update' },
      { name: 'permission:delete', description: 'Delete permissions', resource: 'permission', action: 'delete' },
      
      // Company permissions
      { name: 'company:create', description: 'Create companies', resource: 'company', action: 'create' },
      { name: 'company:read', description: 'Read companies', resource: 'company', action: 'read' },
      { name: 'company:update', description: 'Update companies', resource: 'company', action: 'update' },
      { name: 'company:delete', description: 'Delete companies', resource: 'company', action: 'delete' },
      
      // Package permissions
      { name: 'package:create', description: 'Create packages', resource: 'package', action: 'create' },
      { name: 'package:read', description: 'Read packages', resource: 'package', action: 'read' },
      { name: 'package:update', description: 'Update packages', resource: 'package', action: 'update' },
      { name: 'package:delete', description: 'Delete packages', resource: 'package', action: 'delete' },
      
      // Attendance permissions
      { name: 'attendance:create', description: 'Create attendance', resource: 'attendance', action: 'create' },
      { name: 'attendance:read', description: 'Read attendance', resource: 'attendance', action: 'read' },
      { name: 'attendance:update', description: 'Update attendance', resource: 'attendance', action: 'update' },
      { name: 'attendance:delete', description: 'Delete attendance', resource: 'attendance', action: 'delete' },
      
      // Payment permissions
      { name: 'payment:create', description: 'Create payments', resource: 'payment', action: 'create' },
      { name: 'payment:read', description: 'Read payments', resource: 'payment', action: 'read' },
      { name: 'payment:update', description: 'Update payments', resource: 'payment', action: 'update' },
      { name: 'payment:delete', description: 'Delete payments', resource: 'payment', action: 'delete' },
      
      // Report permissions
      { name: 'report:create', description: 'Create reports', resource: 'report', action: 'create' },
      { name: 'report:read', description: 'Read reports', resource: 'report', action: 'read' },
      { name: 'report:update', description: 'Update reports', resource: 'report', action: 'update' },
      { name: 'report:delete', description: 'Delete reports', resource: 'report', action: 'delete' },
      
      // Notification permissions
      { name: 'notification:create', description: 'Create notifications', resource: 'notification', action: 'create' },
      { name: 'notification:read', description: 'Read notifications', resource: 'notification', action: 'read' },
      { name: 'notification:update', description: 'Update notifications', resource: 'notification', action: 'update' },
      { name: 'notification:delete', description: 'Delete notifications', resource: 'notification', action: 'delete' },
      
      // File permissions
      { name: 'file:upload', description: 'Upload files', resource: 'file', action: 'upload' },
      { name: 'file:read', description: 'Read files', resource: 'file', action: 'read' },
      { name: 'file:update', description: 'Update files', resource: 'file', action: 'update' },
      { name: 'file:delete', description: 'Delete files', resource: 'file', action: 'delete' },
    ];

    for (const permission of allPermissions) {
      const created = await this.prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
      permissionMap.set(permission.name, created.id);
    }

    return permissionMap;
  }

  private async createProfessionalRoles(permissions: Map<string, string>): Promise<void> {
    // Create roles using professional constants
    for (const [roleKey, roleData] of Object.entries(PROFESSIONAL_ROLES)) {
      const role = await this.prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          description: roleData.description,
          category: roleData.category,
          level: roleData.level,
          isSystem: roleData.isSystem,
        },
        create: {
          name: roleData.name,
          description: roleData.description,
          category: roleData.category,
          level: roleData.level,
          isSystem: roleData.isSystem,
        },
      });

      // Assign permissions based on role permissions mapping
      const rolePermissions = ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS] || [];
      
      for (const permissionName of rolePermissions) {
        if (permissionName === '*') {
          // Super admin gets all permissions
          for (const [permName, permId] of permissions) {
            await this.assignPermissionToRole(role.id, permId);
          }
        } else if (permissionName.includes(':*')) {
          // Wildcard permission (e.g., user:*)
          const resource = permissionName.split(':')[0];
          for (const [permName, permId] of permissions) {
            if (permName.startsWith(`${resource}:`)) {
              await this.assignPermissionToRole(role.id, permId);
            }
          }
        } else {
          // Specific permission
          const permId = permissions.get(permissionName);
          if (permId) {
            await this.assignPermissionToRole(role.id, permId);
          }
        }
      }
    }

    // Create default super admin user if not exists
    await this.createDefaultSuperAdmin();
  }

  private async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
  }

  private async createDefaultSuperAdmin(): Promise<void> {
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (superAdminRole) {
      const adminUser = await this.prisma.user.upsert({
        where: { email: 'admin@devsfit.com' },
        update: {},
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          email: 'admin@devsfit.com',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          status: 'ACTIVE',
          emailVerified: true,
          authProvider: 'LOCAL',
        },
      });

      // Assign super admin role
      await this.prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: superAdminRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      });

      this.logger.log('✅ Default super admin user created: admin@devsfit.com (password: password)');
    }
  }
}
