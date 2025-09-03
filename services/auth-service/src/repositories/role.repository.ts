import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class RoleRepository {
  private readonly logger = new Logger(RoleRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findDefaultRole(): Promise<any> {
    this.logger.debug('Finding default role');

    return this.prisma.role.findFirst({
      where: { name: 'user' },
    });
  }

  async findRoleById(id: string): Promise<any> {
    this.logger.debug('Finding role by ID', { roleId: id });

    return this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findRoleByName(name: string): Promise<any> {
    this.logger.debug('Finding role by name', { name });

    return this.prisma.role.findFirst({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getAllRoles(): Promise<any[]> {
    this.logger.debug('Getting all roles');

    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async createRole(data: { name: string; description?: string }): Promise<any> {
    this.logger.debug('Creating role', { name: data.name });

    return this.prisma.role.create({
      data,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async updateRole(id: string, data: { name?: string; description?: string }): Promise<any> {
    this.logger.debug('Updating role', { roleId: id });

    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async deleteRole(id: string): Promise<void> {
    this.logger.debug('Deleting role', { roleId: id });

    await this.prisma.role.delete({
      where: { id },
    });
  }
} 