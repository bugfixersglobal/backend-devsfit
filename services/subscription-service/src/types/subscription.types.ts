import { SubscriptionStatus, UsageMetricType } from '@prisma/client';

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  packageId?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}

export interface UsageFilters {
  subscriptionId?: string;
  companyId?: string;
  metricType?: UsageMetricType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface BillingCalculation {
  baseAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  nextBillingDate: Date;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  revenue: {
    monthly: number;
    yearly: number;
    total: number;
  };
  usage: {
    averageBranches: number;
    averageUsers: number;
    averageStorage: number;
  };
  churn: {
    rate: number;
    reasons: Record<string, number>;
  };
}

export interface UpgradeRequest {
  subscriptionId: string;
  newPackageId: string;
  reason?: string;
  effectiveDate?: Date;
}

export interface TrialExtensionRequest {
  subscriptionId: string;
  extensionDays: number;
  reason?: string;
}
