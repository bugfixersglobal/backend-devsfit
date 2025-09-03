import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Logger,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { SSLCommerzService, SSLCommerzIPNRequest } from '../services/sslcommerz.service';
import { PaymentService } from '../services/payment.service';

@ApiTags('IPN - Instant Payment Notification')
@Controller('ipn')
export class IPNController {
  private readonly logger = new Logger(IPNController.name);

  constructor(
    private readonly sslCommerzService: SSLCommerzService,
    private readonly paymentService: PaymentService,
  ) {}

  // ===================
  // SSLCOMMERZ IPN HANDLER
  // ===================

  @Post('sslcommerz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'SSLCOMMERZ Instant Payment Notification (IPN) handler',
    description: 'Handles payment notifications from SSLCOMMERZ gateway'
  })
  @ApiResponse({ status: 200, description: 'IPN processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid IPN data' })
  @ApiResponse({ status: 500, description: 'IPN processing failed' })
  @ApiBody({ type: Object, description: 'SSLCOMMERZ IPN payload' })
  async handleSSLCommerzIPN(
    @Body() ipnData: any,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') clientIp?: string,
  ) {
    this.logger.log('Received SSLCOMMERZ IPN', {
      tran_id: ipnData.tran_id,
      val_id: ipnData.val_id,
      status: ipnData.status,
      client_ip: clientIp,
      user_agent: userAgent,
    });

    try {
      // Validate required fields
      if (!ipnData.tran_id || !ipnData.val_id || !ipnData.status) {
        this.logger.error('Invalid IPN data received', { ipnData });
        throw new BadRequestException('Invalid IPN data');
      }

      // Process the IPN
      const result = await this.sslCommerzService.processIPN(ipnData);

      if (result.success) {
        // Handle successful payment
        await this.handleSuccessfulPayment(ipnData);
      } else {
        // Handle failed payment
        await this.handleFailedPayment(ipnData);
      }

      // Return success response to SSLCOMMERZ
      return {
        status: 'SUCCESS',
        message: 'IPN processed successfully',
        tran_id: ipnData.tran_id,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error('IPN processing failed', {
        tran_id: ipnData.tran_id,
        error: error.message,
      });

      // Return error response to SSLCOMMERZ
      return {
        status: 'FAILED',
        message: error.message,
        tran_id: ipnData.tran_id,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ===================
  // IPN STATUS CHECK
  // ===================

  @Get('status/:transactionId')
  @ApiOperation({ summary: 'Check IPN status for a transaction' })
  @ApiResponse({ status: 200, description: 'IPN status retrieved successfully' })
  async getIPNStatus(@Param('transactionId') transactionId: string) {
    this.logger.log('Checking IPN status', { transaction_id: transactionId });

    try {
      // Get transaction status from SSLCOMMERZ
      const status = await this.sslCommerzService.getTransactionStatus(transactionId);

      return {
        success: true,
        data: {
          transactionId,
          status: status.status,
          amount: status.amount,
          currency: status.currency,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('IPN status check failed', {
        transaction_id: transactionId,
        error: error.message,
      });

      throw new BadRequestException('IPN status check failed');
    }
  }

  // ===================
  // IPN TEST ENDPOINT
  // ===================

  @Post('test')
  @ApiOperation({ 
    summary: 'Test IPN endpoint',
    description: 'Simulates an IPN for testing purposes'
  })
  @ApiResponse({ status: 200, description: 'Test IPN processed successfully' })
  async testIPN(@Body() testData: any) {
    this.logger.log('Processing test IPN', { test_data: testData });

    try {
      // Create mock IPN data
      const mockIPNData: SSLCommerzIPNRequest = {
        tran_id: testData.tran_id || 'TEST_TXN_' + Date.now(),
        val_id: testData.val_id || 'TEST_VAL_' + Date.now(),
        amount: testData.amount || '100.00',
        store_amount: testData.store_amount || '100.00',
        currency: testData.currency || 'BDT',
        bank_tran_id: testData.bank_tran_id || 'BANK_' + Date.now(),
        status: testData.status || 'VALID',
        tran_date: testData.tran_date || new Date().toISOString(),
        card_type: testData.card_type || 'VISA',
        card_no: testData.card_no || '4111111111111111',
        card_issuer: testData.card_issuer || 'Test Bank',
        card_brand: testData.card_brand || 'VISA',
        card_sub_brand: testData.card_sub_brand || 'CLASSIC',
        card_issuer_country: testData.card_issuer_country || 'Bangladesh',
        card_issuer_country_code: testData.card_issuer_country_code || 'BD',
        value_a: testData.value_a || 'test@example.com',
        value_b: testData.value_b || 'package_id',
        value_c: testData.value_c || 'MONTHLY',
        value_d: testData.value_d || '',
        value_e: '',
        value_f: '',
        value_g: '',
        value_h: '',
        value_i: '',
        value_j: '',
        value_k: '',
        value_l: '',
        value_m: '',
        value_n: '',
        value_o: '',
        value_p: '',
        value_q: '',
        value_r: '',
        value_s: '',
        value_t: '',
        value_u: '',
        value_v: '',
        value_w: '',
        value_x: '',
        value_y: '',
        value_z: '',
        risk_level: '0',
        risk_title: 'Safe',
      };

      // Process the test IPN
      const result = await this.sslCommerzService.processIPN(mockIPNData);

      return {
        success: true,
        message: 'Test IPN processed successfully',
        data: {
          tran_id: mockIPNData.tran_id,
          val_id: mockIPNData.val_id,
          status: mockIPNData.status,
          result: result,
        },
      };
    } catch (error) {
      this.logger.error('Test IPN failed', {
        error: error.message,
      });

      throw new BadRequestException('Test IPN failed');
    }
  }

  // ===================
  // IPN LOGS
  // ===================

  @Get('logs')
  @ApiOperation({ summary: 'Get IPN processing logs' })
  @ApiResponse({ status: 200, description: 'IPN logs retrieved successfully' })
  async getIPNLogs(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    this.logger.log('Retrieving IPN logs', { limit, offset });

    // In a real implementation, this would fetch from a database
    // For now, return mock logs
    const mockLogs = [
      {
        id: 'LOG_001',
        transactionId: 'TXN_123456789',
        status: 'SUCCESS',
        message: 'Payment processed successfully',
        timestamp: new Date().toISOString(),
        ipnData: {
          tran_id: 'TXN_123456789',
          val_id: 'VAL_123456789',
          status: 'VALID',
        },
      },
      {
        id: 'LOG_002',
        transactionId: 'TXN_987654321',
        status: 'FAILED',
        message: 'Payment validation failed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipnData: {
          tran_id: 'TXN_987654321',
          val_id: 'VAL_987654321',
          status: 'INVALID',
        },
      },
    ];

    return {
      success: true,
      data: {
        logs: mockLogs,
        total: mockLogs.length,
        limit,
        offset,
      },
    };
  }

  // ===================
  // PRIVATE HELPER METHODS
  // ===================

  private async handleSuccessfulPayment(ipnData: SSLCommerzIPNRequest) {
    this.logger.log('Handling successful payment', {
      tran_id: ipnData.tran_id,
      val_id: ipnData.val_id,
    });

    try {
      // Extract data from IPN
      const companyId = ipnData.value_a; // companyId from custom field
      const packageId = ipnData.value_b; // packageId from custom field
      const billingCycle = ipnData.value_c as any; // billingCycle from custom field
      const couponCode = ipnData.value_d; // couponCode from custom field

      // Update payment status in payment service
      await this.paymentService.updatePaymentStatus(
        ipnData.tran_id,
        'COMPLETED',
        {
          validationId: ipnData.val_id,
          bankTransactionId: ipnData.bank_tran_id,
          cardType: ipnData.card_type,
          cardBrand: ipnData.card_brand,
        }
      );

      // Emit payment completed event for other services
      await this.paymentService.emitPaymentCompletedEvent({
        transactionId: ipnData.tran_id,
        companyId,
        packageId,
        amount: parseFloat(ipnData.amount),
        currency: ipnData.currency,
        paymentDate: new Date(),
      });

      this.logger.log('Payment completed from IPN', {
        tran_id: ipnData.tran_id,
        company_id: companyId,
        package_id: packageId,
      });

      // TODO: Send confirmation email
      // TODO: Update billing records
      // TODO: Trigger any post-payment workflows

    } catch (error) {
      this.logger.error('Failed to handle successful payment', {
        tran_id: ipnData.tran_id,
        error: error.message,
      });
      throw error;
    }
  }

  private async handleFailedPayment(ipnData: SSLCommerzIPNRequest) {
    this.logger.log('Handling failed payment', {
      tran_id: ipnData.tran_id,
      val_id: ipnData.val_id,
      status: ipnData.status,
    });

    try {
      // TODO: Update payment status
      // TODO: Send failure notification
      // TODO: Trigger retry logic if applicable

      this.logger.log('Failed payment handled', {
        tran_id: ipnData.tran_id,
      });

    } catch (error) {
      this.logger.error('Failed to handle failed payment', {
        tran_id: ipnData.tran_id,
        error: error.message,
      });
      throw error;
    }
  }
}
