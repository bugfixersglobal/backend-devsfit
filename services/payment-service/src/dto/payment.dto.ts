import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentInitiateDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  tran_id: string;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  total_amount: number;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  cus_name: string;

  @ApiProperty({ description: 'Customer email' })
  @IsString()
  cus_email: string;

  @ApiProperty({ description: 'Customer address' })
  @IsString()
  cus_add1: string;

  @ApiProperty({ description: 'Customer city' })
  @IsString()
  cus_city: string;

  @ApiProperty({ description: 'Customer postcode' })
  @IsString()
  cus_postcode: string;

  @ApiProperty({ description: 'Customer country' })
  @IsString()
  cus_country: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  cus_phone: string;

  @ApiProperty({ description: 'Customer state/division' })
  @IsString()
  @IsOptional()
  cus_state?: string;

  @ApiProperty({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  value_a?: string;

  @ApiProperty({ description: 'Package ID' })
  @IsString()
  @IsOptional()
  value_b?: string;

  @ApiProperty({ description: 'Billing cycle' })
  @IsString()
  @IsOptional()
  value_c?: string;

  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  @IsOptional()
  value_d?: string;
}

export class PaymentCallbackDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  tran_id: string;

  @ApiProperty({ description: 'Payment status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Amount' })
  @IsString()
  amount: string;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Validation ID' })
  @IsString()
  @IsOptional()
  val_id?: string;

  @ApiProperty({ description: 'Bank transaction ID' })
  @IsString()
  @IsOptional()
  bank_tran_id?: string;

  @ApiProperty({ description: 'Card type' })
  @IsString()
  @IsOptional()
  card_type?: string;

  @ApiProperty({ description: 'Card number' })
  @IsString()
  @IsOptional()
  card_no?: string;

  @ApiProperty({ description: 'Card issuer' })
  @IsString()
  @IsOptional()
  card_issuer?: string;

  @ApiProperty({ description: 'Card brand' })
  @IsString()
  @IsOptional()
  card_brand?: string;

  @ApiProperty({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  value_a?: string;

  @ApiProperty({ description: 'Package ID' })
  @IsString()
  @IsOptional()
  value_b?: string;

  @ApiProperty({ description: 'Billing cycle' })
  @IsString()
  @IsOptional()
  value_c?: string;

  @ApiProperty({ description: 'Coupon code' })
  @IsString()
  @IsOptional()
  value_d?: string;
}

export class RefundRequestDto {
  @ApiProperty({ description: 'Transaction ID to refund' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Refund amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;
}

export class PaymentStatusResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;

  @ApiProperty({ description: 'Amount' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Payment date' })
  paymentDate: Date;

  @ApiProperty({ description: 'Card type' })
  cardType?: string;

  @ApiProperty({ description: 'Card brand' })
  cardBrand?: string;

  @ApiProperty({ description: 'Company ID' })
  companyId?: string;

  @ApiProperty({ description: 'Package ID' })
  packageId?: string;
}

export class PaymentCompletedEvent {
  transactionId: string;
  companyId: string;
  packageId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
}

export class OptimizedPaymentInitiateDto {
  @ApiProperty({ description: 'User data from auth service' })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  @ApiProperty({ description: 'Company data from company service' })
  company: {
    id: string;
    name: string;
    address: string;
    city: string;
    state?: string;
    postalCode?: string;
    phone?: string;
  };

  @ApiProperty({ description: 'Package data from package service' })
  package: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency', default: 'BDT' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Billing cycle' })
  @IsString()
  billingCycle: 'MONTHLY' | 'YEARLY';

  @ApiProperty({ description: 'Coupon code', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ description: 'Subscription type', default: 'NEW' })
  @IsString()
  @IsOptional()
  subscriptionType?: 'NEW' | 'RENEWAL' | 'UPGRADE';

  @ApiProperty({ description: 'Payment source', default: 'ONBOARDING' })
  @IsString()
  @IsOptional()
  source?: 'ONBOARDING' | 'DASHBOARD' | 'API';
}