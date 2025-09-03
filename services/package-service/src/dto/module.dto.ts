import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  MinLength, 
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ===================
// CREATE MODULE DTO
// ===================

export class CreateModuleDto {
  @ApiProperty({ 
    example: 'Members Management', 
    description: 'Human-readable module name',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    example: '/uploads/icons/members.svg',
    description: 'SVG icon path for the module',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  icon: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether the module is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===================
// UPDATE MODULE DTO
// ===================

export class UpdateModuleDto {
  @ApiPropertyOptional({ 
    example: 'Vendors Management',
    description: 'Human-readable module name',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ 
    example: '/icons/members.svg',
    description: 'SVG icon path for the module',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether the module is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ===================
// MODULE FILTERS DTO
// ===================

export class ModuleFiltersDto {
  @ApiPropertyOptional({ 
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ 
    example: 'members',
    description: 'Search in module name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    example: 'name',
    description: 'Sort by field',
    enum: ['name', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({ 
    example: 'asc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ 
    example: 10,
    description: 'Number of items to return',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ 
    example: 0,
    description: 'Number of items to skip',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

// ===================
// PACKAGE MODULE DTOs
// ===================

export class AssignModuleToPackageDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Module ID to assign',
  })
  @IsString()
  moduleId: string;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether the module is enabled in the package',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class RemoveModuleFromPackageDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Module ID to remove',
  })
  @IsString()
  moduleId: string;
}

export class AssignMultipleModulesDto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '456e7890-e89b-12d3-a456-426614174001'],
    description: 'Array of module IDs to assign',
    type: [String],
  })
  @IsString()
  moduleIds: string[];

  @ApiPropertyOptional({ 
    example: true,
    description: 'Whether the modules are enabled in the package',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

// ===================
// RESPONSE DTOs
// ===================

export class ModuleResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Members Management' })
  name: string;

  @ApiProperty({ example: '/icons/members.svg' })
  icon: string;

  @ApiProperty({ example: 'John Doe' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:45:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class ModuleSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Members Management' })
  name: string;

  @ApiProperty({ example: '/icons/members.svg' })
  icon: string;

  @ApiProperty({ example: 'John Doe' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:45:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class ModuleStatisticsDto {
  @ApiProperty({ example: 25 })
  totalModules: number;

  @ApiProperty({ example: 20 })
  activeModules: number;

  @ApiProperty({ example: 5 })
  inactiveModules: number;

  @ApiProperty({ 
    example: [
      { moduleId: '123e4567-e89b-12d3-a456-426614174000', moduleName: 'Members Management', usageCount: 15 },
      { moduleId: '456e7890-e89b-12d3-a456-426614174001', moduleName: 'Workout Planner', usageCount: 12 }
    ] 
  })
  mostUsedModules: Array<{
    moduleId: string;
    moduleName: string;
    usageCount: number;
  }>;
}

// ===================
// UPLOAD DTOs
// ===================

export class UploadModuleIconDto {
  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    description: 'SVG icon file for the module',
  })
  icon: any;
}
