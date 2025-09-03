import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { 
  InvoiceEntity, 
  CreateInvoiceEntity, 
  UpdateInvoiceEntity 
} from '../entities/billing.entity';
import { InvoiceFilters } from '../types/billing.types';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class InvoiceRepository {
  private readonly logger = new Logger(InvoiceRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceEntity): Promise<InvoiceEntity> {
    this.logger.log('Creating invoice', { 
      companyId: data.companyId, 
      type: data.type 
    });

    try {
      const invoice = await this.prisma.invoice.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      this.logger.log('Invoice created successfully', { 
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber 
      });

      return this.mapToEntity(invoice);
    } catch (error) {
      this.logger.error('Failed to create invoice', { 
        error: error.message,
        companyId: data.companyId 
      });
      throw error;
    }
  }

  async findAll(filters: InvoiceFilters = {}): Promise<{
    invoices: InvoiceEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('Finding invoices', { filters });

    const where: any = {};
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters.startDate || filters.endDate) {
      where.issueDate = {};
      if (filters.startDate) {
        where.issueDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.issueDate.lte = filters.endDate;
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices: invoices.map(invoice => this.mapToEntity(invoice)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<InvoiceEntity | null> {
    this.logger.log('Finding invoice by ID', { id });

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    return invoice ? this.mapToEntity(invoice) : null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<InvoiceEntity | null> {
    this.logger.log('Finding invoice by number', { invoiceNumber });

    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: true,
      },
    });

    return invoice ? this.mapToEntity(invoice) : null;
  }

  async findByCompanyId(companyId: string): Promise<InvoiceEntity[]> {
    this.logger.log('Finding invoices by company ID', { companyId });

    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(invoice => this.mapToEntity(invoice));
  }

  async update(id: string, data: UpdateInvoiceEntity): Promise<InvoiceEntity> {
    this.logger.log('Updating invoice', { 
      id, 
      updateFields: Object.keys(data) 
    });

    try {
      const invoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      this.logger.log('Invoice updated successfully', { id });
      return this.mapToEntity(invoice);
    } catch (error) {
      this.logger.error('Failed to update invoice', { 
        id, 
        error: error.message 
      });
      throw error;
    }
  }

  async markAsPaid(id: string, paymentReference?: string): Promise<InvoiceEntity> {
    this.logger.log('Marking invoice as paid', { id, paymentReference });

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        paidAt: new Date(),
        paymentReference,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return this.mapToEntity(invoice);
  }

  async findOverdueInvoices(): Promise<InvoiceEntity[]> {
    this.logger.log('Finding overdue invoices');

    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'DRAFT'] },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        items: true,
      },
    });

    return invoices.map(invoice => this.mapToEntity(invoice));
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

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const [total, paid, pending, overdue, totalAmount, paidAmount] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      this.prisma.invoice.count({ where: { ...where, status: 'SENT' } }),
      this.prisma.invoice.count({ 
        where: { 
          ...where, 
          status: { in: ['SENT', 'DRAFT'] },
          dueDate: { lt: new Date() }
        } 
      }),
      this.prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      total,
      paid,
      pending,
      overdue,
      totalAmount: Number(totalAmount._sum.totalAmount) || 0,
      paidAmount: Number(paidAmount._sum.totalAmount) || 0,
    };
  }

  private mapToEntity(data: any): InvoiceEntity {
    return {
      id: data.id,
      invoiceNumber: data.invoiceNumber,
      companyId: data.companyId,
      subscriptionId: data.subscriptionId,
      packageId: data.packageId,
      status: data.status,
      type: data.type,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      terms: data.terms,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      paidAt: data.paidAt,
      paymentReference: data.paymentReference,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
