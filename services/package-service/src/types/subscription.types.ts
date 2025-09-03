export interface SubscriptionFilters {
  status?: string;
  packageId?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}

export interface PackageFilters {
  status?: string;
  search?: string;
  isPopular?: boolean;
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'QUARTERLY';
}

export interface CouponFilters {
  status?: string;
  code?: string;
  isExpired?: boolean;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  packageId?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface UpgradeRequest {
  fromPackageId: string;
  toPackageId: string;
  reason?: string;
  effectiveDate?: Date;
  applyProration?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: any;
  discountAmount?: number;
  message: string;
}

export interface UsageLimits {
  branches: {
    current: number;
    limit: number | 'unlimited';
    canAdd: boolean;
  };
  users: {
    current: number;
    limit: number | 'unlimited';
    canAdd: boolean;
  };
  storage: {
    current: number;
    limit: number | 'unlimited';
    unit: 'GB';
    percentage: number;
  };
  apiCalls: {
    current: number;
    limit: number | 'unlimited';
    remaining: number;
  };
}

export interface PackageComparison {
  feature: string;
  currentPackage: boolean | string | number;
  targetPackage: boolean | string | number;
  isUpgrade: boolean;
}

export interface BillingCalculation {
  baseAmount: number;
  discountAmount: number;
  proratedAmount?: number;
  totalAmount: number;
  currency: string;
  nextBillingDate: Date;
}