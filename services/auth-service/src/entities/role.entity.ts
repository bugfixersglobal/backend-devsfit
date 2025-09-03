export class Role {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly level?: number,
    public readonly permissions: Permission[] = [],
    public readonly isSystem: boolean = false,
    public readonly isActive: boolean = true,
  ) {}

  hasPermission(permissionName: string): boolean {
    return this.permissions.some(permission => permission.name === permissionName);
  }

  hasPermissionForResource(resource: string, action: string): boolean {
    return this.permissions.some(
      permission => permission.resource === resource && permission.action === action
    );
  }

  // Professional role validation
  canManageRole(targetRole: Role): boolean {
    if (!this.level || !targetRole.level) return false;
    return this.level > targetRole.level;
  }

  isHigherThan(role: Role): boolean {
    if (!this.level || !role.level) return false;
    return this.level > role.level;
  }

  static fromPrisma(data: any): Role {
    return new Role(
      data.id,
      data.name,
      data.description,
      data.category,
      data.level,
      data.permissions?.map((p: any) => Permission.fromPrisma(p.permission)) || [],
      data.isSystem,
      data.isActive,
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      level: this.level,
      permissions: this.permissions.map(p => p.toJSON()),
      isSystem: this.isSystem,
      isActive: this.isActive,
    };
  }
}

export class Permission {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly description?: string,
  ) {}

  static fromPrisma(data: any): Permission {
    return new Permission(
      data.id,
      data.name,
      data.resource,
      data.action,
      data.description,
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      resource: this.resource,
      action: this.action,
    };
  }
} 