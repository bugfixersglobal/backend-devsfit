export interface InvoiceFilters {
  status?: string;
  type?: string;
  companyId?: string;
  subscriptionId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CouponFilters {
  isActive?: boolean;
  type?: string;
  validFrom?: Date;
  validUntil?: Date;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface BillingCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  taxRate: number;
}

export interface TaxCalculation {
  country: string;
  state?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
}

export interface CouponValidation {
  isValid: boolean;
  discountAmount: number;
  message?: string;
  coupon?: any;
  error?: string;
  finalAmount?: number;
}

export interface BillingAnalytics {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  overdueInvoices: number;
  averageInvoiceAmount: number;
  revenueByMonth: Record<string, number>;
  topCustomers: Array<{
    companyId: string;
    totalSpent: number;
    invoiceCount: number;
  }>;
}

export interface InvoiceGenerationRequest {
  companyId: string;
  subscriptionId?: string;
  packageId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  couponCode?: string;
  billingAddress?: any;
  notes?: string;
  dueDate?: Date;
}
