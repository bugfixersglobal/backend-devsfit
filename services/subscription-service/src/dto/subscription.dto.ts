import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { SubscriptionStatus, BillingCycle } from '@prisma/client';

// ===================
// CREATE SUBSCRIPTION
// ===================

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Package ID' })
  @IsUUID()
  packageId: string;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Base amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiProperty({ description: 'Discount amount', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Auto renew', default: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===================
// UPDATE SUBSCRIPTION
// ===================

export class UpdateSubscriptionDto {
  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus, required: false })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle, required: false })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiProperty({ description: 'Base amount', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseAmount?: number;

  @ApiProperty({ description: 'Discount amount', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ description: 'Auto renew', required: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===================
// UPGRADE SUBSCRIPTION
// ===================

export class UpgradeSubscriptionDto {
  @ApiProperty({ description: 'New package ID' })
  @IsUUID()
  newPackageId: string;

  @ApiProperty({ description: 'Upgrade reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Effective date', required: false })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

// ===================
// CANCEL SUBSCRIPTION
// ===================

export class CancelSubscriptionDto {
  @ApiProperty({ description: 'Cancellation reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Cancel at period end', default: true })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}

// ===================
// EXTEND TRIAL
// ===================

export class ExtendTrialDto {
  @ApiProperty({ description: 'Extension days', minimum: 1, maximum: 30 })
  @IsNumber()
  @Min(1)
  @Max(30)
  extensionDays: number;

  @ApiProperty({ description: 'Extension reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ===================
// UPDATE USAGE
// ===================

export class UpdateUsageDto {
  @ApiProperty({ description: 'Current branches', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentBranches?: number;

  @ApiProperty({ description: 'Current users', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentUsers?: number;

  @ApiProperty({ description: 'Current members', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentMembers?: number;

  @ApiProperty({ description: 'Current staff', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStaff?: number;

  @ApiProperty({ description: 'Storage used in GB', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageUsed?: number;

  @ApiProperty({ description: 'API calls used', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  apiCallsUsed?: number;
}

// ===================
// RESPONSE DTOs
// ===================

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Package ID' })
  packageId: string;

  @ApiProperty({ description: 'Subscription number' })
  subscriptionNumber: string;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Current period start' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Trial start', required: false })
  trialStart?: Date;

  @ApiProperty({ description: 'Trial end', required: false })
  trialEnd?: Date;

  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Current branches' })
  currentBranches: number;

  @ApiProperty({ description: 'Current users' })
  currentUsers: number;

  @ApiProperty({ description: 'Current members' })
  currentMembers: number;

  @ApiProperty({ description: 'Current staff' })
  currentStaff: number;

  @ApiProperty({ description: 'Storage used' })
  storageUsed: number;

  @ApiProperty({ description: 'API calls used' })
  apiCallsUsed: number;

  @ApiProperty({ description: 'Auto renew' })
  autoRenew: boolean;

  @ApiProperty({ description: 'Next billing date', required: false })
  nextBillingDate?: Date;

  @ApiProperty({ description: 'Cancel at period end' })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ description: 'Cancelled at', required: false })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Cancellation reason', required: false })
  cancellationReason?: string;

  @ApiProperty({ description: 'Notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class SubscriptionListResponseDto {
  @ApiProperty({ description: 'Subscriptions', type: [SubscriptionResponseDto] })
  subscriptions: SubscriptionResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}
