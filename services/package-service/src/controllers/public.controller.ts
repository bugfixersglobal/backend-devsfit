import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  Logger 
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PublicPackageService } from '../services/public-package.service';

@ApiTags('Public - Package Information')
@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly publicPackageService: PublicPackageService,
  ) {}

  // ===================
  // PUBLIC PACKAGE ACCESS
  // ===================

  @Get('packages')
  @ApiOperation({ 
    summary: 'Get all active packages (public access)',
    description: 'Retrieve all active packages available for purchase. No authentication required.'
  })
  @ApiQuery({ 
    name: 'featured', 
    required: false, 
    type: Boolean,
    description: 'Filter to show only featured packages (popular/recommended)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Active packages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          packageType: { type: 'string', enum: ['BASIC', 'PRO'] },
          isPopular: { type: 'boolean' },
          maxMembers: { type: 'number' },
          unlimitedMembers: { type: 'boolean' },
          additionalFeatures: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'DRAFT'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          billingCycles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                months: { type: 'number' },
                price: { type: 'number' },
                discount: { type: 'number' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          },
          modules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                isEnabled: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                module: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    icon: { type: 'string' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async getActivePackages(@Query('featured') featured?: boolean) {
    this.logger.log('Public user retrieving active packages', { featured });
    return this.publicPackageService.getActivePackages(featured);
  }

  @Get('packages/:name')
  @ApiOperation({ 
    summary: 'Get package by name (public access)',
    description: 'Retrieve detailed information about a specific package using its name. No authentication required.'
  })
  @ApiParam({ 
    name: 'name', 
    description: 'Package name (e.g., "Basic Package", "Pro Package")' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Package details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        packageType: { type: 'string', enum: ['BASIC', 'PRO'] },
        isPopular: { type: 'boolean' },
        maxMembers: { type: 'number' },
        unlimitedMembers: { type: 'boolean' },
        additionalFeatures: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'DRAFT'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        billingCycles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              months: { type: 'number' },
              price: { type: 'number' },
              discount: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              isEnabled: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              module: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  icon: { type: 'string' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Package not found' })
  async getPackageByName(@Param('name') name: string) {
    this.logger.log('Public user retrieving package by name', { name });
    return this.publicPackageService.getPackageBySlug(name);
  }
}
