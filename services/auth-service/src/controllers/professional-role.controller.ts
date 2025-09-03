import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProfessionalRoleGuard, RequireSuperAdmin, RequireAdmin, RequireManager, RequireStaff } from '../guards/professional-role.guard';
import { RoleValidationService } from '../services/role-validation.service';
import { PrismaService } from '../services/prisma.service';

@ApiTags('Professional Role Management')
@ApiBearerAuth()
@Controller('professional-roles')
@UseGuards(JwtAuthGuard, ProfessionalRoleGuard)
export class ProfessionalRoleController {
  constructor(
    private readonly roleValidationService: RoleValidationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({ summary: 'Get all professional roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getAllRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        { level: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return {
      success: true,
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        category: role.category,
        level: role.level,
        isSystem: role.isSystem,
        isActive: role.isActive,
        permissions: role.permissions.map(rp => rp.permission.name),
        userCount: role._count.users,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    };
  }

  @Get('hierarchy')
  @RequireManager()
  @ApiOperation({ summary: 'Get role hierarchy information' })
  @ApiResponse({ status: 200, description: 'Hierarchy retrieved successfully' })
  async getRoleHierarchy() {
    const roles = await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        level: true,
        isSystem: true,
        isActive: true,
      },
      orderBy: { level: 'desc' },
    });

    const hierarchy = {
      PLATFORM_ROLES: roles.filter(r => r.category === 'PLATFORM_ROLES'),
      BUSINESS_ROLES: roles.filter(r => r.category === 'BUSINESS_ROLES'),
      STAFF_ROLES: roles.filter(r => r.category === 'STAFF_ROLES'),
      MEMBER_ROLES: roles.filter(r => r.category === 'MEMBER_ROLES'),
    };

    return {
      success: true,
      data: hierarchy,
    };
  }

  @Get('user/:userId/hierarchy')
  @RequireManager()
  @ApiOperation({ summary: 'Get user role hierarchy' })
  @ApiResponse({ status: 200, description: 'User hierarchy retrieved successfully' })
  async getUserRoleHierarchy(@Param('userId') userId: string) {
    const hierarchy = await this.roleValidationService.getUserRoleHierarchy(userId);
    
    return {
      success: true,
      data: hierarchy,
    };
  }

  @Post('validate-assignment')
  @RequireManager()
  @ApiOperation({ summary: 'Validate role assignment' })
  @ApiResponse({ status: 200, description: 'Assignment validation result' })
  async validateRoleAssignment(
    @Body() body: { assignerId: string; assigneeId: string; roleId: string }
  ) {
    const result = await this.roleValidationService.canUserAssignRole(
      body.assignerId,
      body.assigneeId,
      body.roleId
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('validate-management')
  @RequireManager()
  @ApiOperation({ summary: 'Validate role management' })
  @ApiResponse({ status: 200, description: 'Management validation result' })
  async validateRoleManagement(
    @Body() body: { userId: string; targetRoleId: string }
  ) {
    const result = await this.roleValidationService.canUserManageRole(
      body.userId,
      body.targetRoleId
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('validate-access')
  @RequireStaff()
  @ApiOperation({ summary: 'Validate resource access' })
  @ApiResponse({ status: 200, description: 'Access validation result' })
  async validateResourceAccess(
    @Query('userId') userId: string,
    @Query('resource') resource: string,
    @Query('action') action: string
  ) {
    const hasAccess = await this.roleValidationService.canUserAccessResource(
      userId,
      resource,
      action
    );

    return {
      success: true,
      data: {
        userId,
        resource,
        action,
        hasAccess,
      },
    };
  }

  @Post('create')
  @RequireSuperAdmin()
  @ApiOperation({ summary: 'Create a new professional role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async createRole(@Body() body: {
    name: string;
    description: string;
    category: string;
    level: number;
    permissions: string[];
  }) {
    // Validate role name
    const nameValidation = this.roleValidationService.validateRoleName(body.name);
    if (!nameValidation.isValid) {
      return {
        success: false,
        message: nameValidation.message,
      };
    }

    // Validate role level
    const levelValidation = this.roleValidationService.validateRoleLevel(body.level);
    if (!levelValidation.isValid) {
      return {
        success: false,
        message: levelValidation.message,
      };
    }

    // Create role
    const role = await this.prisma.role.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        level: body.level,
        isSystem: false,
      },
    });

    // Assign permissions
    for (const permissionName of body.permissions) {
      const permission = await this.prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await this.prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    return {
      success: true,
      data: role,
      message: 'Professional role created successfully',
    };
  }

  @Put(':roleId')
  @RequireSuperAdmin()
  @ApiOperation({ summary: 'Update a professional role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() body: {
      description?: string;
      category?: string;
      level?: number;
      permissions?: string[];
    }
  ) {
    // Check if role exists and is not system role
    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return {
        success: false,
        message: 'Role not found',
      };
    }

    if (existingRole.isSystem) {
      return {
        success: false,
        message: 'Cannot modify system roles',
      };
    }

    // Update role
    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        description: body.description,
        category: body.category,
        level: body.level,
      },
    });

    // Update permissions if provided
    if (body.permissions) {
      // Remove existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions
      for (const permissionName of body.permissions) {
        const permission = await this.prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (permission) {
          await this.prisma.rolePermission.create({
            data: {
              roleId: updatedRole.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    return {
      success: true,
      data: updatedRole,
      message: 'Professional role updated successfully',
    };
  }

  @Delete(':roleId')
  @RequireSuperAdmin()
  @ApiOperation({ summary: 'Delete a professional role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  async deleteRole(@Param('roleId') roleId: string) {
    // Check if role exists and is not system role
    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!existingRole) {
      return {
        success: false,
        message: 'Role not found',
      };
    }

    if (existingRole.isSystem) {
      return {
        success: false,
        message: 'Cannot delete system roles',
      };
    }

    if (existingRole._count.users > 0) {
      return {
        success: false,
        message: `Cannot delete role with ${existingRole._count.users} assigned users`,
      };
    }

    // Delete role (cascade will handle role permissions)
    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return {
      success: true,
      message: 'Professional role deleted successfully',
    };
  }
}
