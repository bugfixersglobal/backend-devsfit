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
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  CreateTaxRateDto,
  UpdateTaxRateDto,
  InvoiceResponseDto,
  CouponResponseDto,
  TaxRateResponseDto,
  InvoiceStatsResponseDto,
  CouponStatsResponseDto,
} from '../dto/billing.dto';
import { InvoiceFilters, CouponFilters } from '../types/billing.types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@ApiTags('Billing')
@Controller('billing')
@ApiBearerAuth('BearerAuth')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Invoice Endpoints
  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice created successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid invoice data',
  })
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SENT', 'PAID', 'CANCELLED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['SUBSCRIPTION', 'ONE_TIME', 'UPGRADE'] })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'subscriptionId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
    type: [InvoiceResponseDto],
  })
  async getInvoices(@Query() filters: InvoiceFilters) {
    return this.billingService.getInvoices(filters);
  }

  @Get('invoices/stats')
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice statistics retrieved successfully',
    type: InvoiceStatsResponseDto,
  })
  async getInvoiceStats(@Query('companyId') companyId?: string) {
    return this.billingService.getInvoiceStats(companyId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  async updateInvoice(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.billingService.updateInvoice(id, updateInvoiceDto);
  }

  @Post('invoices/:id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice marked as paid successfully',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invoice not found',
  })
  async markInvoiceAsPaid(
    @Param('id') id: string,
    @Body() body: { paymentReference?: string },
  ) {
    return this.billingService.markInvoiceAsPaid(id, body.paymentReference);
  }

  // Coupon Endpoints
  @Post('coupons')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new coupon (Super Admin Only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Coupon created successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid coupon data or code already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async createCoupon(@Body() createCouponDto: CreateCouponDto) {
    return this.billingService.createCoupon(createCouponDto);
  }

  @Get('coupons')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Get all coupons with optional filters (Super Admin Only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['PERCENTAGE', 'FIXED'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupons retrieved successfully',
    type: [CouponResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async getCoupons(@Query() filters: CouponFilters) {
    return this.billingService.getCoupons(filters);
  }

  @Get('coupons/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Get coupon by ID (Super Admin Only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon retrieved successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async getCouponById(@Param('id') id: string) {
    return this.billingService.getCouponById(id);
  }

  @Put('coupons/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Update coupon (Super Admin Only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon updated successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async updateCoupon(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.billingService.updateCoupon(id, updateCouponDto);
  }

  @Post('coupons/validate')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Validate a coupon code (Super Admin Only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        error: { type: 'string' },
        coupon: { type: 'object' },
        discountAmount: { type: 'number' },
        finalAmount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async validateCoupon(@Body() validateCouponDto: ValidateCouponDto) {
    return this.billingService.validateCoupon(validateCouponDto);
  }

  @Get('coupons/stats')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Get coupon statistics (Super Admin Only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon statistics retrieved successfully',
    type: CouponStatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async getCouponStats() {
    return this.billingService.getCouponStats();
  }

  // Calculation Endpoints
  @Post('calculate-tax')
  @ApiOperation({ summary: 'Calculate tax for an amount' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculation result',
    schema: {
      type: 'object',
      properties: {
        originalAmount: { type: 'number' },
        taxRate: { type: 'number' },
        taxAmount: { type: 'number' },
        totalAmount: { type: 'number' },
      },
    },
  })
  async calculateTax(
    @Body() body: { amount: number; taxRate: number },
  ) {
    return this.billingService.calculateTax(body.amount, body.taxRate);
  }

  @Post('calculate-invoice')
  @ApiOperation({ summary: 'Calculate invoice totals' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice calculation result',
    schema: {
      type: 'object',
      properties: {
        subtotal: { type: 'number' },
        taxAmount: { type: 'number' },
        discountAmount: { type: 'number' },
        totalAmount: { type: 'number' },
      },
    },
  })
  async calculateInvoiceTotals(@Body() data: any) {
    return this.billingService.calculateInvoiceTotals(data);
  }

  // Maintenance Endpoints
  @Post('maintenance/deactivate-expired-coupons')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Deactivate expired coupons (Super Admin Only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expired coupons deactivated',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Super admin privileges required',
  })
  async deactivateExpiredCoupons() {
    const count = await this.billingService.deactivateExpiredCoupons();
    return { count };
  }

  @Get('maintenance/overdue-invoices')
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overdue invoices retrieved successfully',
    type: [InvoiceResponseDto],
  })
  async getOverdueInvoices() {
    return this.billingService.getOverdueInvoices();
  }

  // Health Check
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        service: { type: 'string' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'billing-service',
    };
  }
}
