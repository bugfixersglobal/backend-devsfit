import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===================
// STEP-BY-STEP PACKAGE CREATION DTOs
// ===================

export class PackageCreationStep1Dto {
  @ApiProperty({ enum: ['BASIC', 'PRO'], example: 'BASIC', description: 'Package type' })
  @IsEnum(['BASIC', 'PRO'])
  packageType: 'BASIC' | 'PRO';

  @ApiProperty({ example: true, description: 'Is most popular package' })
  @IsBoolean()
  isPopular: boolean;
}

export class PackageCreationStep2Dto {
  @ApiProperty({ example: 'Premium Plan', description: 'Package name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Best plan for growing businesses', description: 'Package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 100, description: 'Maximum members' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxMembers?: number;

  @ApiProperty({ example: false, description: 'Allow unlimited members' })
  @IsBoolean()
  unlimitedMembers: boolean;
}

export class BillingCycleDto {
  @ApiProperty({ example: 1, description: 'Number of months' })
  @IsNumber()
  @Min(1)
  months: number;

  @ApiProperty({ example: 5500, description: 'Price amount' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 0, description: 'Discount percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number;
}

export class PackageCreationStep3Dto {
  @ApiProperty({ type: [BillingCycleDto], description: 'Billing cycles with pricing and discounts' })
  @IsArray()
  billingCycles: BillingCycleDto[];
}

export class PackageCreationStep4Dto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'], 
    description: 'Selected module IDs for this package' 
  })
  @IsArray()
  @IsString({ each: true })
  selectedModules: string[];
}

export class PackageCreationStep5Dto {
  @ApiProperty({ example: ['You can manage gym', 'test 2'], description: 'Additional features' })
  @IsArray()
  @IsString({ each: true })
  additionalFeatures: string[];
}

export class PackageCreationStep6Dto {
  @ApiProperty({ example: true, description: 'Confirm package creation' })
  @IsBoolean()
  confirm: boolean;
}

export class CompletePackageCreationDto {
  @ApiProperty({ type: PackageCreationStep1Dto })
  step1: PackageCreationStep1Dto;

  @ApiProperty({ type: PackageCreationStep2Dto })
  step2: PackageCreationStep2Dto;

  @ApiProperty({ type: PackageCreationStep3Dto })
  step3: PackageCreationStep3Dto;

  @ApiProperty({ type: PackageCreationStep4Dto })
  step4: PackageCreationStep4Dto;

  @ApiProperty({ type: PackageCreationStep5Dto })
  step5: PackageCreationStep5Dto;

  @ApiProperty({ type: PackageCreationStep6Dto })
  step6: PackageCreationStep6Dto;
}

// ===================
// SIMPLIFIED PACKAGE DTOs
// ===================

export class CreatePackageDto {
  @ApiProperty({ example: 'Premium Plan', description: 'Package name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Best plan for growing businesses', description: 'Package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['BASIC', 'PRO'], example: 'BASIC', description: 'Package type' })
  @IsEnum(['BASIC', 'PRO'])
  packageType: 'BASIC' | 'PRO';

  @ApiProperty({ example: true, description: 'Is most popular package' })
  @IsBoolean()
  isPopular: boolean;

  @ApiPropertyOptional({ example: 100, description: 'Maximum members' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxMembers?: number;

  @ApiProperty({ example: false, description: 'Allow unlimited members' })
  @IsBoolean()
  unlimitedMembers: boolean;

  @ApiProperty({ type: [BillingCycleDto], description: 'Billing cycles with pricing and discounts' })
  @IsArray()
  billingCycles: BillingCycleDto[];

  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'], 
    description: 'Selected module IDs for this package' 
  })
  @IsArray()
  @IsString({ each: true })
  selectedModules: string[];

  @ApiProperty({ example: ['You can manage gym', 'test 2'], description: 'Additional features' })
  @IsArray()
  @IsString({ each: true })
  additionalFeatures: string[];
}

export class UpdatePackageDto {
  @ApiPropertyOptional({ example: 'Updated Package Name', description: 'Package name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated package description', description: 'Package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['BASIC', 'PRO'], example: 'PRO', description: 'Package type' })
  @IsOptional()
  @IsEnum(['BASIC', 'PRO'])
  packageType?: 'BASIC' | 'PRO';

  @ApiPropertyOptional({ example: true, description: 'Is most popular package' })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: 200, description: 'Maximum members' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxMembers?: number;

  @ApiPropertyOptional({ example: false, description: 'Allow unlimited members' })
  @IsOptional()
  @IsBoolean()
  unlimitedMembers?: boolean;

  @ApiPropertyOptional({ type: [BillingCycleDto], description: 'Billing cycles with pricing and discounts' })
  @IsOptional()
  @IsArray()
  billingCycles?: BillingCycleDto[];

  @ApiPropertyOptional({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'], 
    description: 'Selected module IDs for this package' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedModules?: string[];

  @ApiPropertyOptional({ example: ['Updated feature 1', 'Updated feature 2'], description: 'Additional features' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalFeatures?: string[];
}

// ===================
// MODULE DTOs
// ===================

export class SuperAdminCreateModuleDto {
  @ApiProperty({ example: 'overview', description: 'Module name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'chart', description: 'Module icon' })
  @IsString()
  icon: string;

  @ApiPropertyOptional({ example: true, description: 'Is module active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SuperAdminUpdateModuleDto {
  @ApiPropertyOptional({ example: 'updated-overview', description: 'Module name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'updated-chart', description: 'Module icon' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: true, description: 'Is module active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}