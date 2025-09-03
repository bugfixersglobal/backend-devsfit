import { Injectable, Logger } from '@nestjs/common';
import { MicroserviceClientService } from './microservice-client.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly microserviceClient: MicroserviceClientService,
  ) {}

  async getAllTransactions(filters: any = {}) {
    this.logger.log('Fetching all transactions from billing service');
    return this.microserviceClient.getTransactions(filters);
  }

  async getAllInvoices(filters: any = {}) {
    this.logger.log('Fetching all invoices from billing service');
    return this.microserviceClient.getInvoices(filters);
  }

  async getBillingData(filters: any = {}) {
    this.logger.log('Fetching billing data from billing service');
    return this.microserviceClient.getBillingData(filters);
  }
}
