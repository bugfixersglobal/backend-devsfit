import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum InvoiceType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  ONE_TIME = 'ONE_TIME',
  UPGRADE = 'UPGRADE',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_TRIAL = 'FREE_TRIAL',
}

export enum ApplicableOnType {
  PACKAGES = 'PACKAGES',
  MEMBERSHIPS = 'MEMBERSHIPS',
  SERVICES = 'SERVICES',
  ALL = 'ALL',
}

// ===================
// INVOICE DTOs
// ===================

export class InvoiceItemDto {
  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate', minimum: 0, maximum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiProperty({ description: 'Discount rate', minimum: 0, maximum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  discountRate?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Subscription ID', required: false })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ description: 'Package ID', required: false })
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty({ description: 'Invoice items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Due date' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Currency', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Coupon code', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ description: 'Billing address', required: false })
  @IsOptional()
  billingAddress?: any;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceDto {
  @ApiProperty({ description: 'Invoice status', enum: InvoiceStatus, required: false })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ description: 'Payment reference', required: false })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ===================
// COUPON DTOs
// ===================

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Coupon name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Coupon description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Coupon type', enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Discount value', minimum: 0 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Minimum amount required', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: 'Cap amount', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ description: 'Usage limit', minimum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ description: 'Per user usage limit', minimum: 1 })
  @IsNumber()
  @Min(1)
  maxUsesPerUser: number;

  @ApiProperty({ description: 'Is one-time use', default: true })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiProperty({ description: 'Activation date' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid till', required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Applicable on', enum: ApplicableOnType, default: ApplicableOnType.PACKAGES })
  @IsEnum(ApplicableOnType)
  applicableOn: ApplicableOnType;

  @ApiProperty({ description: 'Applicable package IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePackages?: string[];

  @ApiProperty({ description: 'Applicable membership IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableMemberships?: string[];

  @ApiProperty({ description: 'Applicable service IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableServices?: string[];
}

export class UpdateCouponDto {
  @ApiProperty({ description: 'Coupon name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Coupon description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Coupon type', enum: CouponType, required: false })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiProperty({ description: 'Discount value', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiProperty({ description: 'Minimum amount required', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({ description: 'Maximum discount cap', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ description: 'Total usage limit', minimum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ description: 'Per user usage limit', minimum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerUser?: number;

  @ApiProperty({ description: 'Is one-time use only', required: false })
  @IsOptional()
  @IsBoolean()
  isOneTime?: boolean;

  @ApiProperty({ description: 'Valid from date', required: false })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({ description: 'Valid until date', required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'What this coupon applies to', enum: ApplicableOnType, required: false })
  @IsOptional()
  @IsEnum(ApplicableOnType)
  applicableOn?: ApplicableOnType;

  @ApiProperty({ description: 'Applicable package IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePackages?: string[];

  @ApiProperty({ description: 'Applicable membership IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableMemberships?: string[];

  @ApiProperty({ description: 'Applicable service IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableServices?: string[];
}

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Company ID' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Package ID', required: false })
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiProperty({ description: 'Amount to apply coupon to', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;
}

// ===================
// TAX RATE DTOs
// ===================

export class CreateTaxRateDto {
  @ApiProperty({ description: 'Country code' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'State/province', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Tax rate', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate: number;

  @ApiProperty({ description: 'Tax name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tax description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTaxRateDto {
  @ApiProperty({ description: 'Tax rate', minimum: 0, maximum: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  rate?: number;

  @ApiProperty({ description: 'Tax name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Tax description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===================
// RESPONSE DTOs
// ===================

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Subscription ID', required: false })
  subscriptionId?: string;

  @ApiProperty({ description: 'Package ID', required: false })
  packageId?: string;

  @ApiProperty({ description: 'Invoice status', enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Subtotal' })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Paid at', required: false })
  paidAt?: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class CouponResponseDto {
  @ApiProperty({ description: 'Coupon ID' })
  id: string;

  @ApiProperty({ description: 'Coupon code' })
  code: string;

  @ApiProperty({ description: 'Coupon name' })
  name: string;

  @ApiProperty({ description: 'Coupon description', required: false })
  description?: string;

  @ApiProperty({ description: 'Coupon type', enum: CouponType })
  type: CouponType;

  @ApiProperty({ description: 'Discount value' })
  value: number;

  @ApiProperty({ description: 'Minimum amount required', required: false })
  minAmount?: number;

  @ApiProperty({ description: 'Maximum discount cap', required: false })
  maxDiscount?: number;

  @ApiProperty({ description: 'Total usage limit', required: false })
  maxUses?: number;

  @ApiProperty({ description: 'Current uses' })
  currentUses: number;

  @ApiProperty({ description: 'Per user usage limit' })
  maxUsesPerUser: number;

  @ApiProperty({ description: 'Is one-time use only' })
  isOneTime: boolean;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Valid from (activation date)' })
  validFrom: Date;

  @ApiProperty({ description: 'Valid until (expiry date)', required: false })
  validUntil?: Date;

  @ApiProperty({ description: 'What this coupon applies to', enum: ApplicableOnType })
  applicableOn: ApplicableOnType;

  @ApiProperty({ description: 'Applicable package IDs', required: false })
  applicablePackages?: string[];

  @ApiProperty({ description: 'Applicable membership IDs', required: false })
  applicableMemberships?: string[];

  @ApiProperty({ description: 'Applicable service IDs', required: false })
  applicableServices?: string[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class CouponValidationResponseDto {
  @ApiProperty({ description: 'Is valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Message', required: false })
  message?: string;

  @ApiProperty({ description: 'Coupon details', required: false })
  coupon?: CouponResponseDto;
}

export class TaxRateResponseDto {
  @ApiProperty({ description: 'Tax rate ID' })
  id: string;

  @ApiProperty({ description: 'Country' })
  country: string;

  @ApiProperty({ description: 'State', required: false })
  state?: string;

  @ApiProperty({ description: 'Tax rate' })
  rate: number;

  @ApiProperty({ description: 'Tax name' })
  name: string;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

export class BillingAnalyticsResponseDto {
  @ApiProperty({ description: 'Total invoices' })
  totalInvoices: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Paid invoices' })
  paidInvoices: number;

  @ApiProperty({ description: 'Overdue invoices' })
  overdueInvoices: number;

  @ApiProperty({ description: 'Average invoice amount' })
  averageInvoiceAmount: number;

  @ApiProperty({ description: 'Revenue by month' })
  revenueByMonth: Record<string, number>;

  @ApiProperty({ description: 'Top customers' })
  topCustomers: Array<{
    companyId: string;
    totalSpent: number;
    invoiceCount: number;
  }>;
}

export class InvoiceStatsResponseDto {
  @ApiProperty({ description: 'Total invoices' })
  total: number;

  @ApiProperty({ description: 'Paid invoices' })
  paid: number;

  @ApiProperty({ description: 'Pending invoices' })
  pending: number;

  @ApiProperty({ description: 'Overdue invoices' })
  overdue: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Paid amount' })
  paidAmount: number;
}

export class CouponStatsResponseDto {
  @ApiProperty({ description: 'Total coupons' })
  total: number;

  @ApiProperty({ description: 'Active coupons' })
  active: number;

  @ApiProperty({ description: 'Expired coupons' })
  expired: number;

  @ApiProperty({ description: 'Total usage' })
  totalUsage: number;

  @ApiProperty({ description: 'Total discount' })
  totalDiscount: number;
}
