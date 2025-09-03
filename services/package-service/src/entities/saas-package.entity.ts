export interface PackageEntity {
  id: string;
  name: string;
  description?: string;
  packageType: 'BASIC' | 'PRO';
  isPopular: boolean;
  maxMembers?: number;
  unlimitedMembers: boolean;
  billingCycles: PackageBillingCycleEntity[];
  modules: PackageModuleEntity[];
  additionalFeatures: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageBillingCycleEntity {
  id: string;
  packageId: string;
  months: number;
  price: number;
  discount: number;
  createdAt: Date;
}

export interface PackageModuleEntity {
  id: string;
  packageId: string;
  moduleId: string;
  isEnabled: boolean;
  createdAt: Date;
  module?: ModuleEntity;
}

export interface ModuleEntity {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreatePackageEntity {
  name: string;
  description?: string;
  packageType: 'BASIC' | 'PRO';
  isPopular: boolean;
  maxMembers?: number;
  unlimitedMembers: boolean;
  billingCycles: CreateBillingCycleEntity[];
  selectedModules: string[];
  additionalFeatures: string[];
}

export interface CreateBillingCycleEntity {
  months: number;
  price: number;
  discount: number;
}

export interface UpdatePackageEntity {
  name?: string;
  description?: string;
  packageType?: 'BASIC' | 'PRO';
  isPopular?: boolean;
  maxMembers?: number;
  unlimitedMembers?: boolean;
  billingCycles?: CreateBillingCycleEntity[];
  selectedModules?: string[];
  additionalFeatures?: string[];
}

export interface CreateModuleEntity {
  name: string;
  icon: string;
  isActive?: boolean;
  createdBy: string;
}

export interface UpdateModuleEntity {
  name?: string;
  icon?: string;
  isActive?: boolean;
}