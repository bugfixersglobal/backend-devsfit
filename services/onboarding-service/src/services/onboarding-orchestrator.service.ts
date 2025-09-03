import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CompletePurchaseDto, 
  PurchaseResponseDto, 
  PurchaseStatusDto, 
  PricingDetailsDto 
} from '../dto/purchase.dto';

export interface PackageDetails {
  id: string;
  name: string;
  description: string;
  packageType: 'BASIC' | 'PRO';
  maxMembers: number;
  unlimitedMembers: boolean;
  billingCycles: Array<{
    id: string;
    months: number;
    price: number;
    discount: number;
  }>;
}

export interface CouponDetails {
  code: string;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  isValid: boolean;
  message?: string;
}

@Injectable()
export class OnboardingOrchestratorService {
  private readonly logger = new Logger(OnboardingOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Complete purchase flow with payment-first approach
   */
  async completePurchase(purchaseData: CompletePurchaseDto): Promise<PurchaseResponseDto> {
    const purchaseId = this.generatePurchaseId();
    
    try {
      this.logger.log('Starting purchase flow', { purchaseId });

      // Step 1: Validate and calculate pricing
      const pricingDetails = await this.calculatePricing(purchaseData);
      
      // Step 2: Create purchase record
      const purchaseRecord = await this.createPurchaseRecord(purchaseId, purchaseData, pricingDetails);
      
      // Step 3: Process payment via SSL Commerz
      const paymentResult = await this.processPayment(purchaseRecord, pricingDetails);
      
      if (paymentResult.status === 'SUCCESS') {
        // Step 4: Create company, user, and subscription
        const result = await this.createBusinessEntities(purchaseRecord, paymentResult);
        
        // Step 5: Send confirmation emails
        await this.sendConfirmationEmails(result);
        
        // Step 6: Update purchase status to success
        await this.updatePurchaseStatus(purchaseId, 'SUCCESS');
        
        return {
          success: true,
          message: 'Purchase completed successfully! Welcome to Devsfit.',
          data: {
            purchaseId,
            companyId: result.companyId,
            userId: result.userId,
            subscriptionId: result.subscriptionId,
            paymentId: paymentResult.transactionId,
          }
        };
      } else {
        // Payment failed
        await this.updatePurchaseStatus(purchaseId, 'FAILED', paymentResult.error);
        
        return {
          success: false,
          message: 'Payment failed. Please try again.',
          error: paymentResult.error
        };
      }
      
    } catch (error) {
      this.logger.error('Purchase flow failed', { purchaseId, error: error.message });
      await this.updatePurchaseStatus(purchaseId, 'FAILED', error.message);
      
      throw new InternalServerErrorException('Purchase failed. Please try again.');
    }
  }

  /**
   * Calculate pricing with coupon validation
   */
  private async calculatePricing(purchaseData: CompletePurchaseDto): Promise<PricingDetailsDto> {
    // Get package details from package service
    const packageDetails = await this.getPackageDetails(purchaseData.planSelection.packageId);
    
    // Get billing cycle price
    const billingCycle = packageDetails.billingCycles.find(
      bc => bc.months === (purchaseData.planSelection.billingCycle === 'MONTHLY' ? 1 : 12)
    );
    
    if (!billingCycle) {
      throw new BadRequestException('Invalid billing cycle for selected package');
    }
    
    let subtotal = billingCycle.price;
    let discount = 0;
    let couponApplied = null;
    
    // Apply coupon if provided
    if (purchaseData.planSelection.couponCode) {
      const couponDetails = await this.validateCoupon(purchaseData.planSelection.couponCode);
      
      if (couponDetails.isValid) {
        if (couponDetails.discountType === 'PERCENTAGE') {
          discount = (subtotal * couponDetails.discountAmount) / 100;
        } else {
          discount = couponDetails.discountAmount;
        }
        
        couponApplied = {
          code: couponDetails.code,
          discountAmount: discount,
          discountType: couponDetails.discountType
        };
      }
    }
    
    // Calculate tax (assuming 15% VAT for Bangladesh)
    const taxRate = 0.15;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;
    
    const total = taxableAmount + tax;
    
    return {
      subtotal,
      discount,
      tax,
      total,
      currency: 'BDT',
      couponApplied
    };
  }

  /**
   * Create purchase record in database
   */
  private async createPurchaseRecord(
    purchaseId: string, 
    purchaseData: CompletePurchaseDto, 
    pricingDetails: PricingDetailsDto
  ) {
    return await this.prisma.purchase.create({
      data: {
        id: purchaseId,
        packageId: purchaseData.planSelection.packageId,
        billingCycle: purchaseData.planSelection.billingCycle,
        couponCode: purchaseData.planSelection.couponCode,
        businessName: purchaseData.businessInfo.businessName,
        businessType: purchaseData.businessInfo.businessType,
        businessEmail: purchaseData.businessInfo.businessEmail,
        businessMobile: purchaseData.businessInfo.mobile,
        businessAddress: purchaseData.businessInfo.addressLine1,
        businessCity: purchaseData.businessInfo.city,
        businessZip: purchaseData.businessInfo.zip,
        businessWebsite: purchaseData.businessInfo.websiteUrl,
        personalFirstName: purchaseData.personalInfo.firstName,
        personalLastName: purchaseData.personalInfo.lastName,
        personalEmail: purchaseData.personalInfo.personalEmail,
        personalPhone: purchaseData.personalInfo.phone,
        subtotal: pricingDetails.subtotal,
        discount: pricingDetails.discount,
        tax: pricingDetails.tax,
        total: pricingDetails.total,
        currency: pricingDetails.currency,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Process payment via optimized SSL Commerz integration
   */
  private async processPayment(purchaseRecord: any, pricingDetails: PricingDetailsDto) {
    try {
      // First create temporary user and company entities for payment processing
      const tempUser = {
        id: `temp_user_${purchaseRecord.id}`,
        firstName: purchaseRecord.personalFirstName,
        lastName: purchaseRecord.personalLastName,
        email: purchaseRecord.personalEmail,
        phone: purchaseRecord.personalPhone
      };

      const tempCompany = {
        id: `temp_company_${purchaseRecord.id}`,
        name: purchaseRecord.businessName,
        address: purchaseRecord.businessAddress,
        city: purchaseRecord.businessCity,
        state: 'Dhaka',
        postalCode: purchaseRecord.businessZip,
        phone: purchaseRecord.businessMobile
      };

      // Get package information (you'll need to fetch this from package service)
      const packageInfo = {
        id: purchaseRecord.packageId,
        name: `Package for ${purchaseRecord.businessName}` // You should fetch actual package name
      };

      // Create optimized payment data structure
      const optimizedPaymentData = {
        user: tempUser,
        company: tempCompany,
        package: packageInfo,
        amount: pricingDetails.total,
        currency: pricingDetails.currency || 'BDT',
        billingCycle: purchaseRecord.billingCycle,
        couponCode: purchaseRecord.couponCode,
        subscriptionType: 'NEW',
        source: 'ONBOARDING'
      };

      // Call the optimized payment service endpoint
      const paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL', 'http://payment-service:3005');
      const response = await fetch(`${paymentServiceUrl}/api/payments/initiate-optimized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getInternalServiceToken()}`
        },
        body: JSON.stringify(optimizedPaymentData)
      });

      if (!response.ok) {
        throw new Error(`Payment service responded with status: ${response.status}`);
      }

      const paymentResult = await response.json();

      this.logger.log('Payment initiated successfully', {
        transactionId: paymentResult.transactionId,
        gatewayUrl: paymentResult.gatewayUrl,
        purchaseId: purchaseRecord.id
      });

      return {
        status: 'SUCCESS',
        transactionId: paymentResult.transactionId,
        paymentUrl: paymentResult.gatewayUrl,
        sessionKey: paymentResult.sessionKey,
        paymentDetails: paymentResult.paymentDetails,
        error: null
      };

    } catch (error) {
      this.logger.error('Payment processing failed', {
        error: error.message,
        purchaseId: purchaseRecord.id
      });

      return {
        status: 'FAILED',
        transactionId: null,
        paymentUrl: null,
        error: error.message
      };
    }
  }

  /**
   * Get internal service authentication token
   */
  private getInternalServiceToken(): string {
    return this.configService.get<string>('INTERNAL_SERVICE_TOKEN', 'your-internal-service-secret-token');
  }

  /**
   * Create business entities after successful payment
   * Enhanced to work with optimized payment flow
   */
  private async createBusinessEntities(purchaseRecord: any, paymentResult: any) {
    this.logger.log('Creating business entities after successful payment', {
      transactionId: paymentResult.transactionId,
      purchaseId: purchaseRecord.id
    });

    // Use transaction to ensure data consistency
    return await this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: purchaseRecord.businessName,
          type: purchaseRecord.businessType,
          email: purchaseRecord.businessEmail,
          mobile: purchaseRecord.businessMobile,
          address: purchaseRecord.businessAddress,
          city: purchaseRecord.businessCity,
          zip: purchaseRecord.businessZip,
          website: purchaseRecord.businessWebsite,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create user account
      const user = await tx.user.create({
        data: {
          firstName: purchaseRecord.personalFirstName,
          lastName: purchaseRecord.personalLastName,
          email: purchaseRecord.personalEmail,
          phone: purchaseRecord.personalPhone,
          companyId: company.id,
          role: 'OWNER',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          companyId: company.id,
          packageId: purchaseRecord.packageId,
          billingCycle: purchaseRecord.billingCycle,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: this.calculateEndDate(purchaseRecord.billingCycle),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update purchase record with created entities
      await tx.purchase.update({
        where: { id: purchaseRecord.id },
        data: {
          companyId: company.id,
          userId: user.id,
          subscriptionId: subscription.id,
          paymentId: paymentResult.transactionId,
          status: 'SUCCESS',
          completedAt: new Date()
        }
      });

      return {
        companyId: company.id,
        userId: user.id,
        subscriptionId: subscription.id
      };
    });
  }

  /**
   * Send confirmation emails
   */
  private async sendConfirmationEmails(result: any) {
    // This would integrate with your notification service
    // Send welcome email to personal email
    // Send setup instructions to business email
    this.logger.log('Sending confirmation emails', { 
      companyId: result.companyId,
      userId: result.userId 
    });
  }

  /**
   * Update purchase status
   */
  private async updatePurchaseStatus(purchaseId: string, status: string, error?: string) {
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status,
        error,
        updatedAt: new Date(),
        ...(status === 'SUCCESS' && { completedAt: new Date() })
      }
    });
  }

  /**
   * Get purchase status
   */
  async getPurchaseStatus(purchaseId: string): Promise<PurchaseStatusDto> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId }
    });

    if (!purchase) {
      throw new BadRequestException('Purchase not found');
    }

    return {
      purchaseId: purchase.id,
      status: purchase.status as any,
      error: purchase.error,
      createdAt: purchase.createdAt,
      completedAt: purchase.completedAt
    };
  }

  // Helper methods
  private generatePurchaseId(): string {
    return `PUR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEndDate(billingCycle: string): Date {
    const endDate = new Date();
    if (billingCycle === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    return endDate;
  }

  private async getPackageDetails(packageId: string): Promise<PackageDetails> {
    // This would call your package service
    // For now, returning mock data
    return {
      id: packageId,
      name: 'Basic Package',
      description: 'Perfect for small gyms',
      packageType: 'BASIC',
      maxMembers: 50,
      unlimitedMembers: false,
      billingCycles: [
        { id: '1', months: 1, price: 55, discount: 0 },
        { id: '2', months: 12, price: 550, discount: 110 }
      ]
    };
  }

  private async validateCoupon(couponCode: string): Promise<CouponDetails> {
    // This would call your billing service to validate coupon
    // For now, returning mock validation
    return {
      code: couponCode,
      discountAmount: 10,
      discountType: 'PERCENTAGE',
      isValid: true
    };
  }
}
