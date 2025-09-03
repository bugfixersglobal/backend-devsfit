import { InvoiceStatus, InvoiceType, PaymentStatus, CouponType } from '@prisma/client';

export enum ApplicableOnType {
  PACKAGES = 'PACKAGES',
  MEMBERSHIPS = 'MEMBERSHIPS',
  SERVICES = 'SERVICES',
  ALL = 'ALL',
}

export class InvoiceEntity {
  id: string;
  invoiceNumber: string;
  companyId: string;
  subscriptionId?: string;
  packageId?: string;
  status: InvoiceStatus;
  type: InvoiceType;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  billingAddress?: any;
  shippingAddress?: any;
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  paymentReference?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateInvoiceEntity {
  invoiceNumber: string;
  companyId: string;
  subscriptionId?: string;
  packageId?: string;
  status: InvoiceStatus;
  type: InvoiceType;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  billingAddress?: any;
  shippingAddress?: string;
  notes?: string;
  terms?: string;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  metadata?: any;
}

export class UpdateInvoiceEntity {
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  paidAt?: Date;
  paymentReference?: string;
  notes?: string;
  metadata?: any;
}

export class InvoiceItemEntity {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  metadata?: any;
  createdAt: Date;
}

export class CreateInvoiceItemEntity {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  metadata?: any;
}

export class CouponEntity {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  currentUses: number;
  maxUsesPerUser: number;
  isOneTime: boolean;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  applicableOn: ApplicableOnType;
  applicablePackages?: any;
  applicableMemberships?: any;
  applicableServices?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateCouponEntity {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  maxUsesPerUser: number;
  isOneTime?: boolean;
  validFrom: Date;
  validUntil?: Date;
  isActive?: boolean;
  applicableOn: ApplicableOnType;
  applicablePackages?: any;
  applicableMemberships?: any;
  applicableServices?: any;
  metadata?: any;
}

export class UpdateCouponEntity {
  name?: string;
  description?: string;
  type?: CouponType;
  value?: number;
  minAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  isOneTime?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  applicableOn?: ApplicableOnType;
  applicablePackages?: any;
  applicableMemberships?: any;
  applicableServices?: any;
  metadata?: any;
}

export class TaxRateEntity {
  id: string;
  country: string;
  state?: string;
  rate: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateTaxRateEntity {
  country: string;
  state?: string;
  rate: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export class UpdateTaxRateEntity {
  rate?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}
