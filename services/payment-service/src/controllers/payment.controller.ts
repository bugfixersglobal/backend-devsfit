import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaymentService } from '../services/payment.service';
import { SSLCommerzService } from '../services/sslcommerz.service';
import { PaymentMonitoringService } from '../services/payment-monitoring.service';
import {
  PaymentInitiateDto,
  PaymentCallbackDto,
  RefundRequestDto,
  PaymentStatusResponseDto,
  OptimizedPaymentInitiateDto,
} from '../dto/payment.dto';

@ApiTags('Payment Processing')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly sslCommerzService: SSLCommerzService,
    private readonly monitoringService: PaymentMonitoringService,
  ) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a new payment' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  async initiatePayment(@Body() paymentData: PaymentInitiateDto, @Request() req: any) {
    const companyId = req.user.companyId;
    
    this.logger.log('Initiating payment', { 
      transactionId: paymentData.tran_id,
      companyId,
      amount: paymentData.total_amount 
    });
    
    try {
      // Create a proper SSLCommerz request using the service method
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
      const sslCommerzRequest = {
        store_id: process.env.SSLCOMMERZ_STORE_ID,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
        total_amount: paymentData.total_amount,
        currency: paymentData.currency,
        tran_id: paymentData.tran_id,
        success_url: `${baseUrl}/api/payment/success`,
        fail_url: `${baseUrl}/api/payment/fail`,
        cancel_url: `${baseUrl}/api/payment/cancel`,
        ipn_url: `${baseUrl}/api/payment/ipn`,
        product_category: 'SaaS',
        product_name: 'Gym Management Subscription',
        product_profile: 'general',
        emi_option: 0,
        cus_name: paymentData.cus_name,
        cus_email: paymentData.cus_email,
        cus_phone: paymentData.cus_phone,
        cus_add1: paymentData.cus_add1,
        cus_city: paymentData.cus_city,
        cus_state: paymentData.cus_state || 'Dhaka Division',
        cus_postcode: paymentData.cus_postcode,
        cus_country: paymentData.cus_country,
        cus_fax: '',
        ship_name: paymentData.cus_name,
        ship_add1: paymentData.cus_add1,
        ship_city: paymentData.cus_city,
        ship_state: paymentData.cus_state || 'Dhaka Division',
        ship_postcode: paymentData.cus_postcode,
        ship_country: paymentData.cus_country,
        value_a: paymentData.value_a,
        value_b: paymentData.value_b,
        value_c: paymentData.value_c,
        value_d: paymentData.value_d,
      };
      
      const paymentResult = await this.sslCommerzService.initiatePayment(sslCommerzRequest);
      
      // Store payment record
      await this.paymentService.createPaymentRecord({
        transactionId: paymentData.tran_id,
        companyId,
        amount: paymentData.total_amount,
        currency: paymentData.currency,
        status: 'PENDING',
        paymentData: paymentData,
      });
      
      return {
        success: true,
        transactionId: paymentData.tran_id,
        gatewayUrl: paymentResult.gatewayPageURL,
        sessionKey: paymentResult.sessionkey,
        status: 'PENDING',
      };
    } catch (error) {
      this.logger.error('Payment initiation failed', error);
      throw new BadRequestException('Payment initiation failed: ' + error.message);
    }
  }

  @Post('initiate-optimized')
  @ApiOperation({ summary: 'Initiate payment with optimized data structure' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Payment initiated successfully with optimized structure' })
  async initiateOptimizedPayment(@Body() paymentData: OptimizedPaymentInitiateDto, @Request() req: any) {
    this.logger.log('Initiating optimized payment', {
      userId: paymentData.user.id,
      companyId: paymentData.company.id,
      packageId: paymentData.package.id,
      amount: paymentData.amount,
      billingCycle: paymentData.billingCycle
    });

    try {
      // Create optimized SSLCommerz payment data
      const sslCommerzRequest = this.sslCommerzService.createOptimizedPaymentData({
        user: paymentData.user,
        company: paymentData.company,
        package: paymentData.package,
        amount: paymentData.amount,
        currency: paymentData.currency,
        billingCycle: paymentData.billingCycle,
        couponCode: paymentData.couponCode,
        subscriptionType: paymentData.subscriptionType,
        source: paymentData.source
      });

      // Log payment initiation for monitoring
      this.monitoringService.logPaymentInitiation({
        transactionId: sslCommerzRequest.tran_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'BDT',
        userId: paymentData.user.id,
        companyId: paymentData.company.id,
        packageId: paymentData.package.id,
        metadata: {
          billingCycle: paymentData.billingCycle,
          couponCode: paymentData.couponCode,
          subscriptionType: paymentData.subscriptionType,
          source: paymentData.source
        }
      });

      // Initiate payment with SSLCommerz
      const paymentResult = await this.sslCommerzService.initiatePayment(sslCommerzRequest);

      // Store payment record with enhanced data
      await this.paymentService.createPaymentRecord({
        transactionId: sslCommerzRequest.tran_id,
        companyId: paymentData.company.id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'BDT',
        status: 'PENDING',
        paymentData: {
          user: paymentData.user,
          company: paymentData.company,
          package: paymentData.package,
          billingCycle: paymentData.billingCycle,
          couponCode: paymentData.couponCode,
          subscriptionType: paymentData.subscriptionType,
          source: paymentData.source
        },
      });

      return {
        success: true,
        transactionId: sslCommerzRequest.tran_id,
        gatewayUrl: paymentResult.gatewayPageURL,
        sessionKey: paymentResult.sessionkey,
        status: 'PENDING',
        paymentDetails: {
          amount: paymentData.amount,
          currency: paymentData.currency || 'BDT',
          customer: `${paymentData.user.firstName} ${paymentData.user.lastName}`,
          package: paymentData.package.name,
          billingCycle: paymentData.billingCycle
        }
      };
    } catch (error) {
      this.logger.error('Optimized payment initiation failed', {
        error: error.message,
        userId: paymentData.user.id,
        companyId: paymentData.company.id,
        packageId: paymentData.package.id
      });
      throw new BadRequestException('Payment initiation failed: ' + error.message);
    }
  }

  @Post('callback')
  @ApiOperation({ summary: 'Handle payment callback from SSLCOMMERZ' })
  @ApiResponse({ status: 200, description: 'Payment callback processed successfully' })
  async handlePaymentCallback(@Body() callbackData: PaymentCallbackDto) {
    this.logger.log('Processing payment callback', { 
      transactionId: callbackData.tran_id,
      status: callbackData.status 
    });
    
    try {
      // Verify payment with SSLCOMMERZ
      const verificationResult = await this.sslCommerzService.getTransactionStatus(callbackData.tran_id);
      
      if (verificationResult.status === 'VALID') {
        // Update payment record
        await this.paymentService.updatePaymentStatus(
          callbackData.tran_id,
          'COMPLETED',
          {
            validationId: callbackData.val_id,
            bankTransactionId: callbackData.bank_tran_id,
            cardType: callbackData.card_type,
            cardBrand: callbackData.card_brand,
            verificationData: verificationResult,
          }
        );
        
        // Emit payment completed event
        await this.paymentService.emitPaymentCompletedEvent({
          transactionId: callbackData.tran_id,
          companyId: callbackData.value_a,
          packageId: callbackData.value_b,
          amount: parseFloat(callbackData.amount),
          currency: callbackData.currency,
          paymentDate: new Date(),
        });
        
        return {
          success: true,
          message: 'Payment processed successfully',
          transactionId: callbackData.tran_id,
        };
      } else {
        // Update payment record as failed
        await this.paymentService.updatePaymentStatus(
          callbackData.tran_id,
          'FAILED',
          { failureReason: verificationResult.failedreason }
        );
        
        return {
          success: false,
          message: 'Payment verification failed',
          transactionId: callbackData.tran_id,
        };
      }
    } catch (error) {
      this.logger.error('Payment callback processing failed', error);
      throw new BadRequestException('Payment callback processing failed: ' + error.message);
    }
  }

  @Get('status/:transactionId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiParam({ name: 'transactionId', description: 'Payment transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async getPaymentStatus(@Param('transactionId') transactionId: string): Promise<PaymentStatusResponseDto> {
    this.logger.log('Getting payment status', { transactionId });
    
    const payment = await this.paymentService.getPaymentByTransactionId(transactionId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    
    return {
      transactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentDate: payment.paymentDate,
      cardType: payment.cardType,
      cardBrand: payment.cardBrand,
      companyId: payment.companyId,
      packageId: payment.packageId,
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Process payment refund' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async processRefund(@Body() refundData: RefundRequestDto, @Request() req: any) {
    const companyId = req.user.companyId;
    
    this.logger.log('Processing refund', { 
      transactionId: refundData.transactionId,
      companyId,
      amount: refundData.amount 
    });
    
    try {
      // Verify original payment
      const originalPayment = await this.paymentService.getPaymentByTransactionId(refundData.transactionId);
      if (!originalPayment) {
        throw new NotFoundException('Original payment not found');
      }
      
      if (originalPayment.companyId !== companyId) {
        throw new BadRequestException('Unauthorized refund request');
      }
      
      // Process refund through SSLCOMMERZ
      const refundResult = await this.sslCommerzService.refundPayment(
        refundData.transactionId,
        refundData.amount,
        refundData.reason
      );
      
      // Create refund record
      const refundId = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await this.paymentService.createRefundRecord({
        transactionId: refundData.transactionId,
        originalPaymentId: originalPayment.id,
        amount: refundData.amount,
        reason: refundData.reason,
        refundId: refundId,
        status: 'PROCESSED',
      });
      
      return {
        success: true,
        refundId: refundId,
        message: 'Refund processed successfully',
        amount: refundData.amount,
      };
    } catch (error) {
      this.logger.error('Refund processing failed', error);
      throw new BadRequestException('Refund processing failed: ' + error.message);
    }
  }

  @Get('history/:companyId')
  @ApiOperation({ summary: 'Get payment history for company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(@Param('companyId') companyId: string, @Request() req: any) {
    const userCompanyId = req.user.companyId;
    
    // Ensure user can only access their own company's payment history
    if (userCompanyId !== companyId) {
      throw new BadRequestException('Unauthorized access to payment history');
    }
    
    this.logger.log('Getting payment history', { companyId });
    
    const payments = await this.paymentService.getPaymentHistory(companyId);
    
    return {
      success: true,
      payments: payments.map(payment => ({
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentDate: payment.paymentDate,
        cardType: payment.cardType,
        cardBrand: payment.cardBrand,
      })),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check payment service health' })
  @ApiResponse({ status: 200, description: 'Payment service health status' })
  async getPaymentHealth() {
    try {
      // Check SSLCOMMERZ connectivity
      const sslCommerzHealth = await this.sslCommerzService.checkHealth();
      
      return {
        success: true,
        service: 'payment-service',
        status: 'healthy',
        sslCommerz: sslCommerzHealth,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Payment service health check failed', error);
      return {
        success: false,
        service: 'payment-service',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Callback URL handlers for SSLCommerz
  @Post('success')
  @ApiOperation({ summary: 'Handle successful payment callback' })
  async handlePaymentSuccess(@Body() data: any) {
    this.logger.log('Payment success callback received', { tran_id: data.tran_id });
    
    try {
      // Verify payment with SSLCommerz
      const verificationResult = await this.sslCommerzService.validatePayment(data.val_id);
      
      if (verificationResult.status === 'VALID') {
        // Log successful payment
        this.monitoringService.logPaymentSuccess({
          transactionId: data.tran_id,
          gatewayResponse: verificationResult
        });

        // Update payment status
        await this.paymentService.updatePaymentStatus(data.tran_id, 'COMPLETED', {
          validationId: data.val_id,
          bankTransactionId: data.bank_tran_id,
          cardType: data.card_type,
          cardBrand: data.card_brand,
          verificationData: verificationResult,
        });

        // Emit payment completed event
        await this.paymentService.emitPaymentCompletedEvent({
          transactionId: data.tran_id,
          companyId: data.value_b, // Company ID from custom field
          packageId: data.value_c, // Package ID from custom field
          amount: parseFloat(data.amount),
          currency: data.currency,
          paymentDate: new Date(),
        });

        return { success: true, message: 'Payment successful', transactionId: data.tran_id };
      } else {
        await this.paymentService.updatePaymentStatus(data.tran_id, 'FAILED', { verificationData: verificationResult });
        return { success: false, message: 'Payment verification failed', transactionId: data.tran_id };
      }
    } catch (error) {
      this.logger.error('Payment success handler failed', error);
      await this.paymentService.updatePaymentStatus(data.tran_id, 'FAILED', { error: error.message });
      return { success: false, message: 'Payment processing failed', transactionId: data.tran_id };
    }
  }

  @Post('fail')
  @ApiOperation({ summary: 'Handle failed payment callback' })
  async handlePaymentFail(@Body() data: any) {
    this.logger.log('Payment failure callback received', { tran_id: data.tran_id, reason: data.failedreason });
    
    try {
      // Log payment failure
      this.monitoringService.logPaymentFailure({
        transactionId: data.tran_id,
        errorMessage: data.failedreason || 'Payment failed',
        gatewayResponse: data
      });

      // Update payment status to failed
      await this.paymentService.updatePaymentStatus(data.tran_id, 'FAILED', {
        failureReason: data.failedreason,
        failureData: data,
      });

      return { success: false, message: 'Payment failed', transactionId: data.tran_id, reason: data.failedreason };
    } catch (error) {
      this.logger.error('Payment failure handler failed', error);
      return { success: false, message: 'Payment failure processing failed', transactionId: data.tran_id };
    }
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Handle cancelled payment callback' })
  async handlePaymentCancel(@Body() data: any) {
    this.logger.log('Payment cancellation callback received', { tran_id: data.tran_id });
    
    try {
      // Log payment cancellation
      this.monitoringService.logPaymentCancellation({
        transactionId: data.tran_id
      });

      // Update payment status to cancelled
      await this.paymentService.updatePaymentStatus(data.tran_id, 'CANCELLED', {
        cancellationData: data,
      });

      return { success: false, message: 'Payment cancelled', transactionId: data.tran_id };
    } catch (error) {
      this.logger.error('Payment cancellation handler failed', error);
      return { success: false, message: 'Payment cancellation processing failed', transactionId: data.tran_id };
    }
  }
}
