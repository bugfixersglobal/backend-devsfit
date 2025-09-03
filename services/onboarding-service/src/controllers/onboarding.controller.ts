import { Controller, Post, Get, Body, Param, Logger, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OnboardingOrchestratorService } from '../services/onboarding-orchestrator.service';
import { 
  CompletePurchaseDto, 
  PurchaseResponseDto, 
  PurchaseStatusDto 
} from '../dto/purchase.dto';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(
    private readonly onboardingOrchestratorService: OnboardingOrchestratorService,
  ) {}

  /**
   * Complete purchase flow - single endpoint for all purchase data
   */
  @Post('complete-purchase')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Complete purchase flow',
    description: 'Process complete purchase with plan selection, business info, personal info, and payment. Payment-first approach ensures data is only created after successful payment.'
  })
  @ApiBody({ 
    type: CompletePurchaseDto,
    description: 'Complete purchase data including plan selection, business information, and personal information'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Purchase completed successfully',
    type: PurchaseResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid purchase data or payment failed'
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error during purchase processing'
  })
  async completePurchase(@Body() purchaseData: CompletePurchaseDto): Promise<PurchaseResponseDto> {
    this.logger.log('Processing complete purchase', {
      businessName: purchaseData.businessInfo.businessName,
      packageId: purchaseData.planSelection.packageId,
      billingCycle: purchaseData.planSelection.billingCycle
    });

    return await this.onboardingOrchestratorService.completePurchase(purchaseData);
  }

  /**
   * Get purchase status
   */
  @Get('purchase/:purchaseId/status')
  @ApiOperation({ 
    summary: 'Get purchase status',
    description: 'Retrieve the current status of a purchase by purchase ID'
  })
  @ApiParam({ 
    name: 'purchaseId', 
    description: 'Purchase ID to check status for',
    example: 'PUR_1703123456789_abc123def'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Purchase status retrieved successfully',
    type: PurchaseStatusDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Purchase not found'
  })
  async getPurchaseStatus(@Param('purchaseId') purchaseId: string): Promise<PurchaseStatusDto> {
    this.logger.log('Getting purchase status', { purchaseId });
    
    return await this.onboardingOrchestratorService.getPurchaseStatus(purchaseId);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Onboarding service health check',
    description: 'Check if the onboarding service is healthy and ready to process onboarding requests'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
             properties: {
         status: { type: 'string', example: 'ok' },
         timestamp: { type: 'string', format: 'date-time' },
         service: { type: 'string', example: 'onboarding-service' },
         version: { type: 'string', example: '1.0.0' }
       }
    }
  })
  async healthCheck() {
         return {
       status: 'ok',
       timestamp: new Date().toISOString(),
       service: 'onboarding-service',
       version: '1.0.0'
     };
  }
}
