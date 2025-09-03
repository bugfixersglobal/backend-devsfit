import { SubscriptionStatus, BillingCycle } from '@prisma/client';

export class CompanySubscriptionEntity {
  id: string;
  companyId: string;
  packageId: string;
  subscriptionNumber: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  baseAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  currentBranches: number;
  currentUsers: number;
  currentMembers: number;
  currentStaff: number;
  storageUsed: number;
  apiCallsUsed: number;
  autoRenew: boolean;
  nextBillingDate?: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateCompanySubscriptionEntity {
  companyId: string;
  packageId: string;
  subscriptionNumber: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  baseAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  autoRenew: boolean;
  nextBillingDate?: Date;
  notes?: string;
}

export class UpdateCompanySubscriptionEntity {
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  baseAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  currency?: string;
  currentBranches?: number;
  currentUsers?: number;
  currentMembers?: number;
  currentStaff?: number;
  storageUsed?: number;
  apiCallsUsed?: number;
  autoRenew?: boolean;
  nextBillingDate?: Date;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
  notes?: string;
  internalNotes?: string;
}
