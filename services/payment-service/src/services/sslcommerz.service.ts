import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface SSLCommerzPaymentRequest {
  // Store credentials
  store_id: string;
  store_passwd: string;
  
  // Payment details
  tran_id: string;
  total_amount: number;
  currency: string;
  
  // Callback URLs
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  
  // Product information
  product_category: string;
  product_name?: string;
  product_profile: string;
  emi_option?: number;
  
  // Customer information
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  cus_add1: string;
  cus_city: string;
  cus_state?: string;
  cus_postcode: string;
  cus_country: string;
  cus_fax?: string;
  
  // Shipping information
  ship_name: string;
  ship_add1: string;
  ship_city: string;
  ship_state?: string;
  ship_postcode: string;
  ship_country: string;
  
  // Optional fields
  multi_card_name?: string;
  
  // Custom business data fields
  value_a?: string; // User ID from auth service
  value_b?: string; // Company ID from company service
  value_c?: string; // Package ID from package service
  value_d?: string; // Additional metadata as JSON
}

export interface SSLCommerzPaymentResponse {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  gatewayPageURL?: string;
  storeBanner?: string;
  storeLogo?: string;
  desc?: string;
  is_direct_pay_enable?: string;
  tran_id: string;
  amount: string;
  currency: string;
  val_id?: string;
  bank_tran_id?: string;
  card_type?: string;
  card_no?: string;
  card_issuer?: string;
  card_brand?: string;
  card_sub_brand?: string;
  card_issuer_country?: string;
  card_issuer_country_code?: string;
  store_id?: string;
  store_passwd?: string;
  cus_add1?: string;
  cus_add2?: string;
  cus_city?: string;
  cus_state?: string;
  cus_postcode?: string;
  cus_country?: string;
  cus_phone?: string;
  cus_fax?: string;
  cus_email?: string;
  cus_name?: string;
  ship_add1?: string;
  ship_add2?: string;
  ship_city?: string;
  ship_state?: string;
  ship_postcode?: string;
  ship_country?: string;
  ship_name?: string;
  ship_phone?: string;
  ship_email?: string;
  multi_card_name?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  value_e?: string;
  value_f?: string;
  value_g?: string;
  value_h?: string;
  value_i?: string;
  value_j?: string;
  value_k?: string;
  value_l?: string;
  value_m?: string;
  value_n?: string;
  value_o?: string;
  value_p?: string;
  value_q?: string;
  value_r?: string;
  value_s?: string;
  value_t?: string;
  value_u?: string;
  value_v?: string;
  value_w?: string;
  value_x?: string;
  value_y?: string;
  value_z?: string;
}

export interface SSLCommerzValidationRequest {
  val_id: string;
  store_id: string;
  store_passwd: string;
  format: string;
  v: string;
}

export interface SSLCommerzValidationResponse {
  status: string;
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_sub_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  base_fair: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  value_e: string;
  value_f: string;
  value_g: string;
  value_h: string;
  value_i: string;
  value_j: string;
  value_k: string;
  value_l: string;
  value_m: string;
  value_n: string;
  value_o: string;
  value_p: string;
  value_q: string;
  value_r: string;
  value_s: string;
  value_t: string;
  value_u: string;
  value_v: string;
  value_w: string;
  value_x: string;
  value_y: string;
  value_z: string;
  risk_level: string;
  risk_title: string;
}

export interface SSLCommerzRefundRequest {
  store_id: string;
  store_passwd: string;
  tran_id: string;
  amount: number;
  refund_reason: string;
  format?: string;
}

export interface SSLCommerzRefundResponse {
  status: string;
  message?: string;
  error?: string;
  tran_id: string;
  amount: string;
  refund_reason: string;
  refund_date?: string;
}

export interface SSLCommerzIPNRequest {
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  status: string;
  tran_date: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_sub_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  value_a: string;
  value_b: string;
  value_c: string;
  value_d: string;
  value_e: string;
  value_f: string;
  value_g: string;
  value_h: string;
  value_i: string;
  value_j: string;
  value_k: string;
  value_l: string;
  value_m: string;
  value_n: string;
  value_o: string;
  value_p: string;
  value_q: string;
  value_r: string;
  value_s: string;
  value_t: string;
  value_u: string;
  value_v: string;
  value_w: string;
  value_x: string;
  value_y: string;
  value_z: string;
  risk_level: string;
  risk_title: string;
}

@Injectable()
export class SSLCommerzService {
  private readonly logger = new Logger(SSLCommerzService.name);
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly isSandbox: boolean;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    this.storeId = this.configService.get<string>('SSLCOMMERZ_STORE_ID');
    this.storePassword = this.configService.get<string>('SSLCOMMERZ_STORE_PASSWORD');
    this.isSandbox = this.configService.get<boolean>('SSLCOMMERZ_SANDBOX', true);
    this.timeout = this.configService.get<number>('SSLCOMMERZ_TIMEOUT', 30000); // 30 seconds
    this.maxRetries = this.configService.get<number>('SSLCOMMERZ_MAX_RETRIES', 3);
    
    if (this.isSandbox) {
      this.baseUrl = 'https://sandbox.sslcommerz.com';
    } else {
      this.baseUrl = 'https://securepay.sslcommerz.com';
    }

    this.logger.log(`SSLCommerz initialized in ${this.isSandbox ? 'SANDBOX' : 'PRODUCTION'} mode`);
  }

  private async makeRequest<T>(
    url: string, 
    data: any, 
    retryCount: number = 0
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Devsfit-Package-Service/1.0',
      },
    };

    try {
      this.logger.debug(`Making SSLCommerz request to ${url}`, { 
        retryCount, 
        data: { ...data, store_passwd: '[HIDDEN]' } 
      });

      const response = await axios.post(url, data, config);
      
      this.logger.debug('SSLCommerz response received', {
        status: response.status,
        data: response.data,
      });

      return response.data;
    } catch (error) {
      this.logger.error('SSLCommerz request failed', {
        url,
        retryCount,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Retry logic for network errors and 5xx server errors
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        this.logger.warn(`Retrying SSLCommerz request in ${delay}ms`, { retryCount });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest<T>(url, data, retryCount + 1);
      }

      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  async initiatePayment(paymentData: SSLCommerzPaymentRequest): Promise<SSLCommerzPaymentResponse> {
    this.logger.log('Initiating SSLCommerz payment', { 
      tran_id: paymentData.tran_id,
      amount: paymentData.total_amount,
      customer: paymentData.cus_name,
      product: paymentData.product_name
    });

    try {
      const requestData = {
        // Store credentials
        store_id: paymentData.store_id || this.storeId,
        store_passwd: paymentData.store_passwd || this.storePassword,
        
        // Payment details
        total_amount: paymentData.total_amount,
        currency: paymentData.currency,
        tran_id: paymentData.tran_id,
        
        // Callback URLs
        success_url: paymentData.success_url,
        fail_url: paymentData.fail_url,
        cancel_url: paymentData.cancel_url,
        ipn_url: paymentData.ipn_url,
        
        // Product information
        product_category: paymentData.product_category,
        product_name: paymentData.product_name || 'Gym Management Subscription',
        product_profile: paymentData.product_profile,
        emi_option: paymentData.emi_option || 0,
        
        // Customer information
        cus_name: paymentData.cus_name,
        cus_email: paymentData.cus_email,
        cus_phone: paymentData.cus_phone,
        cus_add1: paymentData.cus_add1,
        cus_city: paymentData.cus_city,
        cus_state: paymentData.cus_state || 'Dhaka',
        cus_postcode: paymentData.cus_postcode,
        cus_country: paymentData.cus_country,
        cus_fax: paymentData.cus_fax || '',
        
        // Shipping information
        ship_name: paymentData.ship_name,
        ship_add1: paymentData.ship_add1,
        ship_city: paymentData.ship_city,
        ship_state: paymentData.ship_state || 'Dhaka',
        ship_postcode: paymentData.ship_postcode,
        ship_country: paymentData.ship_country,
        
        // Optional fields
        multi_card_name: paymentData.multi_card_name,
        
        // Custom business data
        value_a: paymentData.value_a, // User ID
        value_b: paymentData.value_b, // Company ID
        value_c: paymentData.value_c, // Package ID
        value_d: paymentData.value_d, // Metadata JSON
      };

      const response = await this.makeRequest<SSLCommerzPaymentResponse>(
        `${this.baseUrl}/gwprocess/v4/api.php`,
        requestData
      );

      this.logger.log('SSLCommerz payment initiated successfully', {
        tran_id: paymentData.tran_id,
        status: response.status,
        sessionkey: response.sessionkey,
        gatewayUrl: response.gatewayPageURL,
        customer: paymentData.cus_name,
        amount: paymentData.total_amount
      });

      return response;
    } catch (error) {
      this.logger.error('SSLCommerz payment initiation failed', {
        tran_id: paymentData.tran_id,
        error: error.message,
      });
      throw new BadRequestException('Payment initiation failed');
    }
  }

  async validatePayment(valId: string): Promise<SSLCommerzValidationResponse> {
    this.logger.log('Validating SSLCommerz payment', { val_id: valId });

    try {
      const response = await this.makeRequest<SSLCommerzValidationResponse>(
        `${this.baseUrl}/validator/api/validationserverAPI.php`,
        {
          val_id: valId,
          store_id: this.storeId,
          store_passwd: this.storePassword,
          format: 'json',
          v: '1',
        }
      );

      this.logger.log('SSLCommerz payment validation completed', {
        val_id: valId,
        status: response.status,
        tran_id: response.tran_id,
      });

      return response;
    } catch (error) {
      this.logger.error('SSLCommerz payment validation failed', {
        val_id: valId,
        error: error.message,
      });
      throw new BadRequestException('Payment validation failed');
    }
  }

  async refundPayment(tranId: string, amount: number, reason: string): Promise<SSLCommerzRefundResponse> {
    this.logger.log('Processing SSLCommerz refund', { 
      tran_id: tranId,
      amount,
      reason 
    });

    try {
      // According to SSLCOMMERZ documentation, refund endpoint is different
      const response = await this.makeRequest<SSLCommerzRefundResponse>(
        `${this.baseUrl}/gwprocess/v4/api.php`,
        {
          store_id: this.storeId,
          store_passwd: this.storePassword,
          tran_id: tranId,
          amount: amount,
          refund_reason: reason,
          format: 'json',
        }
      );

      this.logger.log('SSLCommerz refund processed successfully', {
        tran_id: tranId,
        status: response.status,
        message: response.message,
      });

      return response;
    } catch (error) {
      this.logger.error('SSLCommerz refund failed', {
        tran_id: tranId,
        error: error.message,
      });
      throw new BadRequestException('Refund processing failed');
    }
  }

  async getTransactionStatus(tranId: string): Promise<any> {
    this.logger.log('Getting SSLCommerz transaction status', { tran_id: tranId });

    try {
      const response = await this.makeRequest<any>(
        `${this.baseUrl}/gwprocess/v4/api.php`,
        {
          store_id: this.storeId,
          store_passwd: this.storePassword,
          tran_id: tranId,
          format: 'json',
        }
      );

      this.logger.log('SSLCommerz transaction status retrieved', {
        tran_id: tranId,
        status: response.status,
      });

      return response;
    } catch (error) {
      this.logger.error('SSLCommerz transaction status check failed', {
        tran_id: tranId,
        error: error.message,
      });
      throw new BadRequestException('Transaction status check failed');
    }
  }

  async processIPN(ipnData: SSLCommerzIPNRequest): Promise<{ success: boolean; message: string }> {
    this.logger.log('Processing SSLCommerz IPN', { 
      tran_id: ipnData.tran_id,
      val_id: ipnData.val_id,
      status: ipnData.status 
    });

    try {
      // Validate IPN data
      if (!ipnData.tran_id || !ipnData.val_id || !ipnData.status) {
        throw new BadRequestException('Invalid IPN data');
      }

      // Verify the transaction with SSLCOMMERZ
      const validationResponse = await this.validatePayment(ipnData.val_id);

      if (validationResponse.status !== 'VALID') {
        this.logger.warn('IPN validation failed', {
          tran_id: ipnData.tran_id,
          val_id: ipnData.val_id,
          status: validationResponse.status,
        });
        return { success: false, message: 'IPN validation failed' };
      }

      this.logger.log('SSLCommerz IPN processed successfully', {
        tran_id: ipnData.tran_id,
        val_id: ipnData.val_id,
        status: ipnData.status,
      });

      return { success: true, message: 'IPN processed successfully' };
    } catch (error) {
      this.logger.error('SSLCommerz IPN processing failed', {
        tran_id: ipnData.tran_id,
        error: error.message,
      });
      throw new BadRequestException('IPN processing failed');
    }
  }

  generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  getPaymentStatus(status: string): 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' {
    switch (status.toLowerCase()) {
      case 'valid':
      case 'success':
        return 'SUCCESS';
      case 'failed':
      case 'invalid':
        return 'FAILED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Create optimized SSLCommerz payment data structure
   * Integrates with user, company, and package data
   */
  createOptimizedPaymentData(params: {
    // User data (from auth service)
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    
    // Company data (from company service)
    company: {
      id: string;
      name: string;
      address: string;
      city: string;
      state?: string;
      postalCode?: string;
      phone?: string;
    };
    
    // Package data (from package service)
    package: {
      id: string;
      name: string;
    };
    
    // Payment details
    amount: number;
    currency?: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    couponCode?: string;
    subscriptionType?: 'NEW' | 'RENEWAL' | 'UPGRADE';
    source?: 'ONBOARDING' | 'DASHBOARD' | 'API';
  }): SSLCommerzPaymentRequest {
    const baseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:5000');
    const transactionId = `TXN_${Date.now()}_${params.company.id.slice(0, 8)}`;
    
    return {
      // Store credentials
      store_id: this.storeId,
      store_passwd: this.storePassword,
      
      // Payment details
      total_amount: params.amount,
      currency: params.currency || 'BDT',
      tran_id: transactionId,
      
      // Callback URLs
      success_url: `${baseUrl}/api/payment/success`,
      fail_url: `${baseUrl}/api/payment/fail`,
      cancel_url: `${baseUrl}/api/payment/cancel`,
      ipn_url: `${baseUrl}/api/payment/ipn`,
      
      // Product information
      product_category: 'SaaS',
      product_name: `${params.package.name} - ${params.billingCycle} Subscription`,
      product_profile: 'general',
      emi_option: 0,
      
      // Customer information
      cus_name: `${params.user.firstName} ${params.user.lastName}`,
      cus_email: params.user.email,
      cus_phone: params.user.phone || params.company.phone || '',
      cus_add1: params.company.address,
      cus_city: params.company.city,
      cus_state: params.company.state || 'Dhaka',
      cus_postcode: params.company.postalCode || '1000',
      cus_country: 'Bangladesh',
      cus_fax: '',
      
      // Shipping information (same as customer for SaaS)
      ship_name: `${params.user.firstName} ${params.user.lastName}`,
      ship_add1: params.company.address,
      ship_city: params.company.city,
      ship_state: params.company.state || 'Dhaka',
      ship_postcode: params.company.postalCode || '1000',
      ship_country: 'Bangladesh',
      
      // Custom business data
      value_a: params.user.id,           // User ID from auth service
      value_b: params.company.id,        // Company ID from company service
      value_c: params.package.id,        // Package ID from package service
      value_d: JSON.stringify({          // Additional metadata as JSON
        billingCycle: params.billingCycle,
        couponCode: params.couponCode || null,
        subscriptionType: params.subscriptionType || 'NEW',
        source: params.source || 'ONBOARDING',
        timestamp: new Date().toISOString()
      })
    };
  }

  // Utility method to check if SSLCOMMERZ is available
  async checkHealth(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.makeRequest(
        `${this.baseUrl}/gwprocess/v4/api.php`,
        {
          store_id: this.storeId,
          store_passwd: this.storePassword,
          format: 'json',
        },
        1 // Single retry for health check
      );
      
      return {
        healthy: true,
        message: 'SSLCOMMERZ is healthy',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `SSLCOMMERZ health check failed: ${error.message}`,
      };
    }
  }
}
