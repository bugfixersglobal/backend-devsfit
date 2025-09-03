import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class RolePermissionSeeder {
  private readonly logger = new Logger(RolePermissionSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    try {
      this.logger.log('Starting roles and permissions seeding...');

      // Create permissions
      const permissions = [
        // User management
        { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
        { name: 'user:read', description: 'Read users', resource: 'user', action: 'read' },
        { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
        { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },

        // Company management
        { name: 'company:create', description: 'Create companies', resource: 'company', action: 'create' },
        { name: 'company:read', description: 'Read companies', resource: 'company', action: 'read' },
        { name: 'company:update', description: 'Update companies', resource: 'company', action: 'update' },
        { name: 'company:delete', description: 'Delete companies', resource: 'company', action: 'delete' },

        // Package management
        { name: 'package:create', description: 'Create packages', resource: 'package', action: 'create' },
        { name: 'package:read', description: 'Read packages', resource: 'package', action: 'read' },
        { name: 'package:update', description: 'Update packages', resource: 'package', action: 'update' },
        { name: 'package:delete', description: 'Delete packages', resource: 'package', action: 'delete' },

        // Attendance management
        { name: 'attendance:create', description: 'Create attendance', resource: 'attendance', action: 'create' },
        { name: 'attendance:read', description: 'Read attendance', resource: 'attendance', action: 'read' },
        { name: 'attendance:update', description: 'Update attendance', resource: 'attendance', action: 'update' },
        { name: 'attendance:delete', description: 'Delete attendance', resource: 'attendance', action: 'delete' },

        // Payment management
        { name: 'payment:create', description: 'Create payments', resource: 'payment', action: 'create' },
        { name: 'payment:read', description: 'Read payments', resource: 'payment', action: 'read' },
        { name: 'payment:update', description: 'Update payments', resource: 'payment', action: 'update' },
        { name: 'payment:delete', description: 'Delete payments', resource: 'payment', action: 'delete' },

        // File management
        { name: 'file:upload', description: 'Upload files', resource: 'file', action: 'upload' },
        { name: 'file:read', description: 'Read files', resource: 'file', action: 'read' },
        { name: 'file:delete', description: 'Delete files', resource: 'file', action: 'delete' },

        // Notification management
        { name: 'notification:read', description: 'Read notifications', resource: 'notification', action: 'read' },
        { name: 'notification:create', description: 'Create notifications', resource: 'notification', action: 'create' },

        // Report management
        { name: 'report:create', description: 'Create reports', resource: 'report', action: 'create' },
        { name: 'report:read', description: 'Read reports', resource: 'report', action: 'read' },
        { name: 'report:update', description: 'Update reports', resource: 'report', action: 'update' },
        { name: 'report:delete', description: 'Delete reports', resource: 'report', action: 'delete' },
      ];

      this.logger.log('Creating permissions...');
      const createdPermissions = [];
      for (const permission of permissions) {
        const created = await this.prisma.permission.upsert({
          where: { name: permission.name },
          update: {},
          create: permission,
        });
        createdPermissions.push(created);
      }

      // Create roles with permissions
      const rolesData = [
        {
          name: 'super_admin',
          description: 'Super administrator with full access',
          isSystem: true,
          permissions: createdPermissions.map(p => p.id), // All permissions
        },
        {
          name: 'admin',
          description: 'Administrator with limited access',
          isSystem: true,
          permissions: createdPermissions.filter(p => 
            !p.name.includes('delete') || p.resource === 'user'
          ).map(p => p.id),
        },
        {
          name: 'manager',
          description: 'Gym manager',
          isSystem: false,
          permissions: createdPermissions.filter(p => 
            ['user:read', 'company:read', 'package:read', 'attendance:create', 'attendance:read', 'payment:read', 'report:read'].includes(p.name)
          ).map(p => p.id),
        },
        {
          name: 'trainer',
          description: 'Gym trainer',
          isSystem: false,
          permissions: createdPermissions.filter(p => 
            ['attendance:create', 'attendance:read', 'user:read', 'package:read', 'notification:read', 'file:upload', 'file:read', 'report:read'].includes(p.name)
          ).map(p => p.id),
        },
        {
          name: 'receptionist',
          description: 'Front desk receptionist',
          isSystem: false,
          permissions: createdPermissions.filter(p => 
            ['user:read', 'user:create', 'user:update', 'attendance:create', 'attendance:read', 'package:read', 'payment:create', 'payment:read', 'file:upload', 'file:read', 'notification:read'].includes(p.name)
          ).map(p => p.id),
        },
        {
          name: 'user',
          description: 'Gym member',
          isSystem: false,
          permissions: createdPermissions.filter(p => 
            ['attendance:read', 'package:read', 'payment:read', 'file:upload', 'file:read', 'notification:read'].includes(p.name)
          ).map(p => p.id),
        },
      ];

      this.logger.log('Creating roles...');
      for (const roleData of rolesData) {
        const { permissions: permissionIds, ...roleInfo } = roleData;
        
        const role = await this.prisma.role.upsert({
          where: { name: roleData.name },
          update: {},
          create: roleInfo,
        });

        // Create role-permission relationships
        for (const permissionId of permissionIds) {
          await this.prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permissionId,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permissionId,
            },
          });
        }

        this.logger.log(`Updated role: ${role.name} with ${permissionIds.length} permissions`);
      }

      this.logger.log('Roles and permissions seeding completed');
    } catch (error) {
      this.logger.error('Error seeding roles and permissions:', error);
      throw error;
    }
  }
} 