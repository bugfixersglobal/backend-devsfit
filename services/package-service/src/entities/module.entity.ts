import { Module as ModuleInterface, CreateModuleRequest, UpdateModuleRequest } from '../types/module.types';

export class Module {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly isActive: boolean,
  ) {}

  // Business logic methods
  get isEnabled(): boolean {
    return this.isActive;
  }

  get hasIcon(): boolean {
    return !!this.icon;
  }

  // Validation methods
  static validateName(name: string): boolean {
    // Allow human‑readable names like "Members Management", "Reports & Analytics"
    // Letters, numbers, spaces, ampersands, and hyphens; 2–100 chars
    const allowedPattern = /^[A-Za-z0-9 &-]{2,100}$/;
    return allowedPattern.test(name);
  }

  static validateIcon(icon: string): boolean {
    return icon.length > 0 && icon.length <= 255;
  }

  // Factory method from Prisma data
  static fromPrisma(data: any): Module {
    return new Module(
      data.id,
      data.name,
      data.icon,
      data.createdBy,
      data.createdAt,
      data.updatedAt,
      data.isActive,
    );
  }

  // Factory method for creation
  static create(data: CreateModuleRequest): Omit<ModuleInterface, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: data.name,
      icon: data.icon,
      isActive: data.isActive ?? true,
      createdBy: data.createdBy,
    };
  }

  // Factory method for update
  static update(data: UpdateModuleRequest): Partial<ModuleInterface> {
    const updateData: Partial<ModuleInterface> = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }
    
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    
    return updateData;
  }

  // Convert to JSON for API responses
  toJSON(): ModuleInterface {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
    };
  }

  // Convert to summary for list views
  toSummary(): Pick<ModuleInterface, 'id' | 'name' | 'icon' | 'createdBy' | 'createdAt' | 'updatedAt' | 'isActive'> {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
    };
  }
}
