import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanySubscriptionRepository } from '../repositories/company-subscription.repository';
import { CreateSubscriptionDto, UpdateSubscriptionDto, UpgradeSubscriptionDto, CancelSubscriptionDto, ExtendTrialDto, UpdateUsageDto } from '../dto/subscription.dto';
import { CompanySubscriptionEntity, CreateCompanySubscriptionEntity } from '../entities/company-subscription.entity';
import { BillingCalculation } from '../types/subscription.types';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly subscriptionRepository: CompanySubscriptionRepository,
    private readonly configService: ConfigService,
  ) {}

  async createSubscription(createDto: CreateSubscriptionDto): Promise<CompanySubscriptionEntity> {
    this.logger.log('Creating subscription', { 
      companyId: createDto.companyId, 
      packageId: createDto.packageId 
    });

    // Check for existing active subscription
    const existingSubscription = await this.subscriptionRepository.findByCompanyId(createDto.companyId);
    if (existingSubscription && (existingSubscription.status === SubscriptionStatus.ACTIVE || existingSubscription.status === SubscriptionStatus.TRIAL)) {
      throw new Error('Company already has an active subscription');
    }

    // Calculate billing periods
    const billingCalculation = this.calculateBillingPeriods(createDto.billingCycle);
    
    // Generate subscription number
    const subscriptionNumber = await this.generateSubscriptionNumber();

    // Prepare subscription data
    const subscriptionData: CreateCompanySubscriptionEntity = {
      companyId: createDto.companyId,
      packageId: createDto.packageId,
      subscriptionNumber,
      status: SubscriptionStatus.TRIAL,
      billingCycle: createDto.billingCycle,
      currentPeriodStart: billingCalculation.currentPeriodStart,
      currentPeriodEnd: billingCalculation.currentPeriodEnd,
      trialStart: billingCalculation.trialStart,
      trialEnd: billingCalculation.trialEnd,
      baseAmount: createDto.baseAmount,
      discountAmount: createDto.discountAmount || 0,
      totalAmount: (createDto.baseAmount - (createDto.discountAmount || 0)),
      currency: createDto.currency || 'USD',
      autoRenew: createDto.autoRenew !== false,
      nextBillingDate: billingCalculation.nextBillingDate,
      notes: createDto.notes,
    };

    // Create subscription
    const subscription = await this.subscriptionRepository.create(subscriptionData);

    this.logger.log('Subscription created successfully', {
      subscriptionId: subscription.id,
      subscriptionNumber: subscription.subscriptionNumber,
      companyId: createDto.companyId,
    });

    return subscription;
  }

  async getSubscription(id: string): Promise<CompanySubscriptionEntity | null> {
    this.logger.log('Getting subscription', { id });
    return this.subscriptionRepository.findById(id);
  }

  async getCompanySubscription(companyId: string): Promise<CompanySubscriptionEntity | null> {
    this.logger.log('Getting company subscription', { companyId });
    return this.subscriptionRepository.findByCompanyId(companyId);
  }

  async updateSubscription(id: string, updateDto: UpdateSubscriptionDto): Promise<CompanySubscriptionEntity> {
    this.logger.log('Updating subscription', { id, updateFields: Object.keys(updateDto) });
    
    const subscription = await this.subscriptionRepository.update(id, updateDto);
    
    this.logger.log('Subscription updated successfully', { id });
    return subscription;
  }

  async upgradeSubscription(id: string, upgradeDto: UpgradeSubscriptionDto): Promise<CompanySubscriptionEntity> {
    this.logger.log('Upgrading subscription', { 
      id, 
      newPackageId: upgradeDto.newPackageId,
      reason: upgradeDto.reason 
    });

    // TODO: Implement upgrade logic with package service communication
    // This would involve:
    // 1. Validating the new package exists
    // 2. Calculating price differences
    // 3. Creating upgrade record
    // 4. Updating subscription

    throw new Error('Upgrade functionality not yet implemented');
  }

  async cancelSubscription(id: string, cancelDto: CancelSubscriptionDto): Promise<CompanySubscriptionEntity> {
    this.logger.log('Cancelling subscription', { 
      id, 
      reason: cancelDto.reason,
      cancelAtPeriodEnd: cancelDto.cancelAtPeriodEnd 
    });

    const subscription = await this.subscriptionRepository.cancel(
      id, 
      cancelDto.reason, 
      cancelDto.cancelAtPeriodEnd !== false
    );

    this.logger.log('Subscription cancelled successfully', { id });
    return subscription;
  }

  async extendTrial(id: string, extendDto: ExtendTrialDto): Promise<CompanySubscriptionEntity> {
    this.logger.log('Extending trial', { 
      id, 
      extensionDays: extendDto.extensionDays,
      reason: extendDto.reason 
    });

    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'TRIAL') {
      throw new Error('Subscription is not in trial status');
    }

    const newTrialEnd = new Date(subscription.trialEnd || subscription.currentPeriodEnd);
    newTrialEnd.setDate(newTrialEnd.getDate() + extendDto.extensionDays);

    const updatedSubscription = await this.subscriptionRepository.update(id, {
      trialEnd: newTrialEnd,
      currentPeriodEnd: newTrialEnd,
      notes: extendDto.reason ? `${subscription.notes || ''}\nTrial extended: ${extendDto.reason}` : subscription.notes,
    });

    this.logger.log('Trial extended successfully', { id, newTrialEnd });
    return updatedSubscription;
  }

  async updateUsage(id: string, usageDto: UpdateUsageDto): Promise<CompanySubscriptionEntity> {
    this.logger.log('Updating subscription usage', { id, usage: usageDto });

    const subscription = await this.subscriptionRepository.updateUsage(id, usageDto);
    
    this.logger.log('Usage updated successfully', { id });
    return subscription;
  }

  async getSubscriptions(filters: any = {}): Promise<{
    subscriptions: CompanySubscriptionEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('Getting subscriptions with filters', { filters });
    return this.subscriptionRepository.findAll(filters);
  }

  async getExpiringSubscriptions(days = 7): Promise<CompanySubscriptionEntity[]> {
    this.logger.log('Getting expiring subscriptions', { days });
    return this.subscriptionRepository.findExpiringSoon(days);
  }

  async getTrialEndingSubscriptions(days = 3): Promise<CompanySubscriptionEntity[]> {
    this.logger.log('Getting trial ending subscriptions', { days });
    return this.subscriptionRepository.findTrialEnding(days);
  }

  private calculateBillingPeriods(billingCycle: string): {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialStart: Date;
    trialEnd: Date;
    nextBillingDate: Date;
  } {
    const now = new Date();
    const trialDays = this.configService.get('DEFAULT_TRIAL_DAYS', 14);
    
    const trialStart = new Date(now);
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let nextBillingDate: Date;

    switch (billingCycle) {
      case 'MONTHLY':
        currentPeriodStart = new Date(now);
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        nextBillingDate = new Date(currentPeriodEnd);
        break;
      
      case 'QUARTERLY':
        currentPeriodStart = new Date(now);
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
        nextBillingDate = new Date(currentPeriodEnd);
        break;
      
      case 'YEARLY':
        currentPeriodStart = new Date(now);
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        nextBillingDate = new Date(currentPeriodEnd);
        break;
      
      case 'LIFETIME':
        currentPeriodStart = new Date(now);
        currentPeriodEnd = new Date('2099-12-31'); // Far future date
        nextBillingDate = null;
        break;
      
      default:
        throw new Error(`Unsupported billing cycle: ${billingCycle}`);
    }

    return {
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      nextBillingDate,
    };
  }

  private async generateSubscriptionNumber(): Promise<string> {
    const prefix = this.configService.get('SUBSCRIPTION_NUMBER_PREFIX', 'SUB');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const subscriptionNumber = `${prefix}${timestamp}${random}`;
    
    // Check if number already exists
    const existing = await this.subscriptionRepository.findBySubscriptionNumber(subscriptionNumber);
    if (existing) {
      // Retry with different random number
      return this.generateSubscriptionNumber();
    }
    
    return subscriptionNumber;
  }
}
