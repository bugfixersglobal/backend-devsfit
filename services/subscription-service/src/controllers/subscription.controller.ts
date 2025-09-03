import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
  Logger,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
  ExtendTrialDto,
  UpdateUsageDto,
  SubscriptionResponseDto,
  SubscriptionListResponseDto,
} from '../dto/subscription.dto';
import { SubscriptionStatus } from '@prisma/client';

@ApiTags('Subscription Management')
@Controller('subscriptions')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ===================
  // CREATE SUBSCRIPTION
  // ===================

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  async createSubscription(@Body() createDto: CreateSubscriptionDto) {
    this.logger.log('Creating subscription', { 
      companyId: createDto.companyId,
      packageId: createDto.packageId 
    });

    try {
      const subscription = await this.subscriptionService.createSubscription(createDto);
      
      return {
        success: true,
        data: subscription,
        message: 'Subscription created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create subscription', { 
        error: error.message,
        companyId: createDto.companyId 
      });
      throw new BadRequestException(error.message);
    }
  }

  // ===================
  // GET SUBSCRIPTIONS
  // ===================

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions with filters' })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'packageId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully', type: SubscriptionListResponseDto })
  async getSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('packageId') packageId?: string,
    @Query('companyId') companyId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log('Getting subscriptions', { status, packageId, companyId, page, limit });

    const filters = {
      status,
      packageId,
      companyId,
      page,
      limit,
    };

    const result = await this.subscriptionService.getSubscriptions(filters);
    
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully', type: SubscriptionResponseDto })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('Getting subscription', { id });

    const subscription = await this.subscriptionService.getSubscription(id);
    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    return {
      success: true,
      data: subscription,
    };
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company subscription' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company subscription retrieved successfully', type: SubscriptionResponseDto })
  async getCompanySubscription(@Param('companyId') companyId: string) {
    this.logger.log('Getting company subscription', { companyId });

    const subscription = await this.subscriptionService.getCompanySubscription(companyId);
    
    if (!subscription) {
      return {
        success: true,
        data: null,
        message: 'No active subscription found for this company',
      };
    }

    return {
      success: true,
      data: subscription,
    };
  }

  // ===================
  // UPDATE SUBSCRIPTION
  // ===================

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully', type: SubscriptionResponseDto })
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ) {
    this.logger.log('Updating subscription', { id, updateFields: Object.keys(updateDto) });

    try {
      const subscription = await this.subscriptionService.updateSubscription(id, updateDto);
      
      return {
        success: true,
        data: subscription,
        message: 'Subscription updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update subscription', { id, error: error.message });
      throw new BadRequestException(error.message);
    }
  }

  // ===================
  // UPGRADE SUBSCRIPTION
  // ===================

  @Post(':id/upgrade')
  @ApiOperation({ summary: 'Upgrade subscription to different package' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded successfully', type: SubscriptionResponseDto })
  async upgradeSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ) {
    this.logger.log('Upgrading subscription', { 
      id, 
      newPackageId: upgradeDto.newPackageId,
      reason: upgradeDto.reason 
    });

    try {
      const subscription = await this.subscriptionService.upgradeSubscription(id, upgradeDto);
      
      return {
        success: true,
        data: subscription,
        message: 'Subscription upgraded successfully',
      };
    } catch (error) {
      this.logger.error('Failed to upgrade subscription', { id, error: error.message });
      throw new BadRequestException(error.message);
    }
  }

  // ===================
  // CANCEL SUBSCRIPTION
  // ===================

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully', type: SubscriptionResponseDto })
  async cancelSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    this.logger.log('Cancelling subscription', { 
      id, 
      reason: cancelDto.reason,
      cancelAtPeriodEnd: cancelDto.cancelAtPeriodEnd 
    });

    try {
      const subscription = await this.subscriptionService.cancelSubscription(id, cancelDto);
      
      return {
        success: true,
        data: subscription,
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      this.logger.error('Failed to cancel subscription', { id, error: error.message });
      throw new BadRequestException(error.message);
    }
  }

  // ===================
  // EXTEND TRIAL
  // ===================

  @Post(':id/extend-trial')
  @ApiOperation({ summary: 'Extend trial period' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Trial extended successfully', type: SubscriptionResponseDto })
  async extendTrial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() extendDto: ExtendTrialDto,
  ) {
    this.logger.log('Extending trial', { 
      id, 
      extensionDays: extendDto.extensionDays,
      reason: extendDto.reason 
    });

    try {
      const subscription = await this.subscriptionService.extendTrial(id, extendDto);
      
      return {
        success: true,
        data: subscription,
        message: 'Trial extended successfully',
      };
    } catch (error) {
      this.logger.error('Failed to extend trial', { id, error: error.message });
      throw new BadRequestException(error.message);
    }
  }

  // ===================
  // UPDATE USAGE
  // ===================

  @Put(':id/usage')
  @ApiOperation({ summary: 'Update subscription usage metrics' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, description: 'Usage updated successfully', type: SubscriptionResponseDto })
  async updateUsage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() usageDto: UpdateUsageDto,
  ) {
    this.logger.log('Updating usage', { id, usage: usageDto });

    try {
      const subscription = await this.subscriptionService.updateUsage(id, usageDto);
      
      return {
        success: true,
        data: subscription,
        message: 'Usage updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update usage', { id, error: error.message });
      throw new BadRequestException(error.message);
    }
  }

  // ===================
  // ANALYTICS & REPORTS
  // ===================

  @Get('analytics/expiring')
  @ApiOperation({ summary: 'Get subscriptions expiring soon' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days ahead to check (default: 7)' })
  @ApiResponse({ status: 200, description: 'Expiring subscriptions retrieved successfully' })
  async getExpiringSubscriptions(@Query('days') days: number = 7) {
    this.logger.log('Getting expiring subscriptions', { days });

    const subscriptions = await this.subscriptionService.getExpiringSubscriptions(days);
    
    return {
      success: true,
      data: {
        subscriptions,
        count: subscriptions.length,
        daysAhead: days,
      },
    };
  }

  @Get('analytics/trial-ending')
  @ApiOperation({ summary: 'Get trials ending soon' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Days ahead to check (default: 3)' })
  @ApiResponse({ status: 200, description: 'Trial ending subscriptions retrieved successfully' })
  async getTrialEndingSubscriptions(@Query('days') days: number = 3) {
    this.logger.log('Getting trial ending subscriptions', { days });

    const subscriptions = await this.subscriptionService.getTrialEndingSubscriptions(days);
    
    return {
      success: true,
      data: {
        subscriptions,
        count: subscriptions.length,
        daysAhead: days,
      },
    };
  }
}
