import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { 
  CompanySubscriptionEntity, 
  CreateCompanySubscriptionEntity, 
  UpdateCompanySubscriptionEntity 
} from '../entities/company-subscription.entity';
import { SubscriptionFilters } from '../types/subscription.types';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class CompanySubscriptionRepository {
  private readonly logger = new Logger(CompanySubscriptionRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompanySubscriptionEntity): Promise<CompanySubscriptionEntity> {
    this.logger.log('Creating company subscription', { 
      companyId: data.companyId, 
      packageId: data.packageId 
    });

    try {
      const subscription = await this.prisma.companySubscription.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log('Company subscription created successfully', { 
        id: subscription.id,
        subscriptionNumber: subscription.subscriptionNumber 
      });

      return this.mapToEntity(subscription);
    } catch (error) {
      this.logger.error('Failed to create company subscription', { 
        error: error.message,
        companyId: data.companyId 
      });
      throw error;
    }
  }

  async findAll(filters: SubscriptionFilters = {}): Promise<{
    subscriptions: CompanySubscriptionEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('Finding company subscriptions', { filters });

    const where: any = {};
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.packageId) {
      where.packageId = filters.packageId;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.companySubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.companySubscription.count({ where }),
    ]);

    return {
      subscriptions: subscriptions.map(sub => this.mapToEntity(sub)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<CompanySubscriptionEntity | null> {
    this.logger.log('Finding subscription by ID', { id });

    const subscription = await this.prisma.companySubscription.findUnique({
      where: { id },
      include: {
        upgradeHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return subscription ? this.mapToEntity(subscription) : null;
  }

  async findByCompanyId(companyId: string): Promise<CompanySubscriptionEntity | null> {
    this.logger.log('Finding active subscription by company ID', { companyId });

    const subscription = await this.prisma.companySubscription.findFirst({
      where: { 
        companyId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscription ? this.mapToEntity(subscription) : null;
  }

  async findBySubscriptionNumber(subscriptionNumber: string): Promise<CompanySubscriptionEntity | null> {
    this.logger.log('Finding subscription by number', { subscriptionNumber });

    const subscription = await this.prisma.companySubscription.findUnique({
      where: { subscriptionNumber },
    });

    return subscription ? this.mapToEntity(subscription) : null;
  }

  async update(id: string, data: UpdateCompanySubscriptionEntity): Promise<CompanySubscriptionEntity> {
    this.logger.log('Updating company subscription', { 
      id, 
      updateFields: Object.keys(data) 
    });

    try {
      const subscription = await this.prisma.companySubscription.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      this.logger.log('Company subscription updated successfully', { id });
      return this.mapToEntity(subscription);
    } catch (error) {
      this.logger.error('Failed to update company subscription', { 
        id, 
        error: error.message 
      });
      throw error;
    }
  }

  async updateUsage(id: string, usage: {
    currentBranches?: number;
    currentUsers?: number;
    currentMembers?: number;
    currentStaff?: number;
    storageUsed?: number;
    apiCallsUsed?: number;
  }): Promise<CompanySubscriptionEntity> {
    this.logger.log('Updating subscription usage', { id, usage });

    const subscription = await this.prisma.companySubscription.update({
      where: { id },
      data: {
        ...usage,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(subscription);
  }

  async cancel(id: string, reason?: string, cancelAtPeriodEnd = true): Promise<CompanySubscriptionEntity> {
    this.logger.log('Cancelling subscription', { id, reason, cancelAtPeriodEnd });

    const updateData: any = {
      cancelAtPeriodEnd,
      cancellationReason: reason,
      updatedAt: new Date(),
    };

    if (!cancelAtPeriodEnd) {
      updateData.status = 'CANCELLED';
      updateData.cancelledAt = new Date();
    }

    const subscription = await this.prisma.companySubscription.update({
      where: { id },
      data: updateData,
    });

    return this.mapToEntity(subscription);
  }

  async findExpiringSoon(days = 7): Promise<CompanySubscriptionEntity[]> {
    this.logger.log('Finding subscriptions expiring soon', { days });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const subscriptions = await this.prisma.companySubscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        currentPeriodEnd: {
          lte: expiryDate,
        },
      },
    });

    return subscriptions.map(sub => this.mapToEntity(sub));
  }

  async findTrialEnding(days = 3): Promise<CompanySubscriptionEntity[]> {
    this.logger.log('Finding trials ending soon', { days });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const subscriptions = await this.prisma.companySubscription.findMany({
      where: {
        status: SubscriptionStatus.TRIAL,
        trialEnd: {
          lte: endDate,
        },
      },
    });

    return subscriptions.map(sub => this.mapToEntity(sub));
  }

  async bulkUpdateStatus(ids: string[], status: SubscriptionStatus, reason?: string): Promise<number> {
    this.logger.log('Bulk updating subscription status', { 
      count: ids.length, 
      status, 
      reason 
    });

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.internalNotes = reason;
    }

    if (status === SubscriptionStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = reason;
    }

    const result = await this.prisma.companySubscription.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    this.logger.log('Bulk status update completed', { updatedCount: result.count });
    return result.count;
  }

  private mapToEntity(data: any): CompanySubscriptionEntity {
    return {
      id: data.id,
      companyId: data.companyId,
      packageId: data.packageId,
      subscriptionNumber: data.subscriptionNumber,
      status: data.status,
      billingCycle: data.billingCycle,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialStart: data.trialStart,
      trialEnd: data.trialEnd,
      baseAmount: data.baseAmount,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      currentBranches: data.currentBranches,
      currentUsers: data.currentUsers,
      currentMembers: data.currentMembers,
      currentStaff: data.currentStaff,
      storageUsed: data.storageUsed,
      apiCallsUsed: data.apiCallsUsed,
      autoRenew: data.autoRenew,
      nextBillingDate: data.nextBillingDate,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      cancelledAt: data.cancelledAt,
      cancellationReason: data.cancellationReason,
      notes: data.notes,
      internalNotes: data.internalNotes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
