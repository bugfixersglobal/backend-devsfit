import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { 
  CreateInvoiceDto, 
  UpdateInvoiceDto, 
  CreateCouponDto, 
  UpdateCouponDto,
  ValidateCouponDto,
  CreateTaxRateDto,
  UpdateTaxRateDto
} from '../dto/billing.dto';
import { 
  InvoiceEntity, 
  CouponEntity, 
  TaxRateEntity 
} from '../entities/billing.entity';
import { 
  InvoiceFilters, 
  CouponFilters, 
  BillingCalculation,
  TaxCalculation 
} from '../types/billing.types';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly couponRepository: CouponRepository,
  ) {}

  // Invoice Management
  async createInvoice(data: CreateInvoiceDto): Promise<InvoiceEntity> {
    this.logger.log('Creating invoice', { companyId: data.companyId });

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate totals
    const calculation = await this.calculateInvoiceTotals(data);

    const invoiceData = {
      ...data,
      invoiceNumber,
      subtotal: calculation.subtotal,
      taxAmount: calculation.taxAmount,
      discountAmount: calculation.discountAmount,
      totalAmount: calculation.totalAmount,
      currency: 'USD',
      status: 'DRAFT' as InvoiceStatus,
      paymentStatus: 'PENDING' as PaymentStatus,
      issueDate: new Date(),
      dueDate: new Date(data.dueDate),
    };

    return this.invoiceRepository.create(invoiceData);
  }

  async getInvoices(filters: InvoiceFilters = {}): Promise<{
    invoices: InvoiceEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('Getting invoices', { filters });
    return this.invoiceRepository.findAll(filters);
  }

  async getInvoiceById(id: string): Promise<InvoiceEntity> {
    this.logger.log('Getting invoice by ID', { id });

    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoice(id: string, data: UpdateInvoiceDto): Promise<InvoiceEntity> {
    this.logger.log('Updating invoice', { id });

    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.invoiceRepository.update(id, data);
  }

  async markInvoiceAsPaid(id: string, paymentReference?: string): Promise<InvoiceEntity> {
    this.logger.log('Marking invoice as paid', { id, paymentReference });

    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.invoiceRepository.markAsPaid(id, paymentReference);
  }

  async getInvoiceStats(companyId?: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
  }> {
    this.logger.log('Getting invoice statistics', { companyId });
    return this.invoiceRepository.getInvoiceStats(companyId);
  }

  // Coupon Management
  async createCoupon(data: CreateCouponDto): Promise<CouponEntity> {
    this.logger.log('Creating coupon', { code: data.code });

    // Validate coupon code uniqueness
    const existingCoupon = await this.couponRepository.findByCode(data.code);
    if (existingCoupon) {
      throw new BadRequestException('Coupon code already exists');
    }

    const couponData = {
      ...data,
      validFrom: new Date(data.validFrom),
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      isActive: data.isActive ?? true,
    };

    return this.couponRepository.create(couponData);
  }

  async getCoupons(filters: CouponFilters = {}): Promise<{
    coupons: CouponEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('Getting coupons', { filters });
    return this.couponRepository.findAll(filters);
  }

  async getCouponById(id: string): Promise<CouponEntity> {
    this.logger.log('Getting coupon by ID', { id });

    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(id: string, data: UpdateCouponDto): Promise<CouponEntity> {
    this.logger.log('Updating coupon', { id });

    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updateData = {
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    };

    return this.couponRepository.update(id, updateData);
  }

  async validateCoupon(data: ValidateCouponDto): Promise<{
    isValid: boolean;
    error?: string;
    coupon?: CouponEntity;
    discountAmount?: number;
    finalAmount?: number;
  }> {
    this.logger.log('Validating coupon', { code: data.code });

    return this.couponRepository.validateCoupon(
      data.code,
      data.companyId,
      data.amount
    );
  }

  async getCouponStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
    totalDiscount: number;
  }> {
    this.logger.log('Getting coupon statistics');
    return this.couponRepository.getCouponStats();
  }

  // Billing Calculations
  async calculateInvoiceTotals(data: any): Promise<BillingCalculation> {
    this.logger.log('Calculating invoice totals');

    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    // Calculate subtotal from items
    if (data.items && data.items.length > 0) {
      subtotal = data.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
    }

    // Apply coupon discount if provided
    if (data.couponCode) {
      const couponValidation = await this.couponRepository.validateCoupon(
        data.couponCode,
        data.companyId,
        subtotal
      );

      if (couponValidation.isValid) {
        discountAmount = couponValidation.discountAmount || 0;
      }
    }

    // Calculate tax
    const taxableAmount = subtotal - discountAmount;
    const taxRate = process.env.DEFAULT_TAX_RATE ? parseFloat(process.env.DEFAULT_TAX_RATE) : 0;
    taxAmount = taxableAmount * (taxRate / 100);

    const totalAmount = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: 'USD',
      taxRate,
    };
  }

  async calculateTax(amount: number, taxRate: number): Promise<TaxCalculation> {
    this.logger.log('Calculating tax', { amount, taxRate });

    const taxAmount = amount * (taxRate / 100);
    const totalAmount = amount + taxAmount;

    return {
      country: 'US',
      subtotal: amount,
      taxRate,
      taxAmount,
    };
  }

  // Utility Methods
  private async generateInvoiceNumber(): Promise<string> {
    const prefix = process.env.INVOICE_NUMBER_PREFIX || 'INV';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}-${timestamp}-${random}`;
  }

  private calculateDueDate(dueDate?: Date): Date {
    if (dueDate) {
      return dueDate;
    }

    // Default to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    return defaultDueDate;
  }

  // Maintenance Tasks
  async deactivateExpiredCoupons(): Promise<number> {
    this.logger.log('Running expired coupon cleanup');
    return this.couponRepository.deactivateExpiredCoupons();
  }

  async getOverdueInvoices(): Promise<InvoiceEntity[]> {
    this.logger.log('Getting overdue invoices');
    return this.invoiceRepository.findOverdueInvoices();
  }
}
