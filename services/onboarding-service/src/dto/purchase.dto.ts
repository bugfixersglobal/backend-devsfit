import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsBoolean, IsUUID, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Step 1: Plan Selection DTO
export class PlanSelectionDto {
  @ApiProperty({ description: 'Selected package ID' })
  @IsUUID()
  packageId: string;

  @ApiProperty({ description: 'Billing cycle', enum: ['MONTHLY', 'YEARLY'] })
  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';

  @ApiProperty({ description: 'Optional coupon code', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}

// Step 2: Business Information DTO
export class BusinessInfoDto {
  @ApiProperty({ description: 'Business name', example: 'XposeFitness' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'Business type', enum: ['PERSONAL', 'CORPORATE'] })
  @IsEnum(['PERSONAL', 'CORPORATE'])
  businessType: 'PERSONAL' | 'CORPORATE';

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Zip code' })
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty({ description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ description: 'Business email' })
  @IsEmail()
  businessEmail: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @IsOptional()
  @IsString()
  websiteUrl?: string;
}

// Step 3: Personal Information DTO
export class PersonalInfoDto {
  @ApiProperty({ description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Personal email' })
  @IsEmail()
  personalEmail: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

// Complete Purchase DTO
export class CompletePurchaseDto {
  @ApiProperty({ description: 'Plan selection details' })
  @ValidateNested()
  @Type(() => PlanSelectionDto)
  planSelection: PlanSelectionDto;

  @ApiProperty({ description: 'Business information' })
  @ValidateNested()
  @Type(() => BusinessInfoDto)
  businessInfo: BusinessInfoDto;

  @ApiProperty({ description: 'Personal information' })
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo: PersonalInfoDto;
}

// Purchase Response DTOs
export class PurchaseResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: {
    purchaseId: string;
    companyId: string;
    userId: string;
    subscriptionId: string;
    paymentId: string;
    paymentUrl?: string;
  };

  @ApiProperty({ required: false })
  error?: string;
}

// Purchase Status DTO
export class PurchaseStatusDto {
  @ApiProperty()
  purchaseId: string;

  @ApiProperty({ enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED'] })
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

  @ApiProperty({ required: false })
  paymentUrl?: string;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;
}

// Pricing Details DTO
export class PricingDetailsDto {
  @ApiProperty()
  subtotal: number;

  @ApiProperty({ required: false })
  discount?: number;

  @ApiProperty()
  tax: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ required: false })
  couponApplied?: {
    code: string;
    discountAmount: number;
    discountType: 'PERCENTAGE' | 'FIXED';
  };
}
