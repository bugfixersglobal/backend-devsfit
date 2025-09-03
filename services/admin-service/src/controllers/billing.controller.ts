import { 
  Controller, 
  Get, 
  Query,
  UseGuards, 
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { BillingService } from '../services/billing.service';

@ApiTags('Admin - Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getAllTransactions(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.log('Admin retrieving transactions');
    return this.billingService.getAllTransactions({ status, startDate, endDate });
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getAllInvoices(@Query('status') status?: string) {
    this.logger.log('Admin retrieving invoices');
    return this.billingService.getAllInvoices({ status });
  }
}
