// ===================
// MODULE SYSTEM TYPES
// ===================

// Base Module interface matching Prisma schema
export interface Module {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Module with package relationships
export interface ModuleWithPackages extends Module {
  packageModules: PackageModule[];
}

// Package-Module junction
export interface PackageModule {
  id: string;
  packageId: string;
  moduleId: string;
  isEnabled: boolean;
  createdAt: Date;
  module: Module;
}

// Module filters for queries
export interface ModuleFilters {
  isActive?: boolean;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Module creation request
export interface CreateModuleRequest {
  name: string;
  icon: string;
  isActive?: boolean;
  createdBy: string;
}

// Module update request
export interface UpdateModuleRequest {
  name?: string;
  icon?: string;
  isActive?: boolean;
}

// Module assignment to package
export interface AssignModuleToPackageRequest {
  moduleId: string;
  isEnabled?: boolean;
}

// Module removal from package
export interface RemoveModuleFromPackageRequest {
  moduleId: string;
}

// Multiple module assignment
export interface AssignMultipleModulesRequest {
  moduleIds: string[];
  isEnabled?: boolean;
}

// Module status
export const MODULE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type ModuleStatus = typeof MODULE_STATUS[keyof typeof MODULE_STATUS];

// Module sorting options
export const MODULE_SORT_OPTIONS = {
  NAME: 'name',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

export type ModuleSortOption = typeof MODULE_SORT_OPTIONS[keyof typeof MODULE_SORT_OPTIONS];

// Module statistics
export interface ModuleStatistics {
  totalModules: number;
  activeModules: number;
  inactiveModules: number;
  mostUsedModules: Array<{
    moduleId: string;
    moduleName: string;
    usageCount: number;
  }>;
}

// Module validation rules
export const MODULE_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  ICON_MAX_LENGTH: 255,
} as const;
