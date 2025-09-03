import { Injectable, Logger } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // Counters
  private readonly paymentRequestsTotal = new Counter({
    name: 'payment_requests_total',
    help: 'Total number of payment requests',
    labelNames: ['method', 'status', 'payment_gateway'],
  });

  private readonly paymentErrorsTotal = new Counter({
    name: 'payment_errors_total',
    help: 'Total number of payment errors',
    labelNames: ['error_type', 'payment_gateway'],
  });

  private readonly transactionStatusChanges = new Counter({
    name: 'transaction_status_changes_total',
    help: 'Total number of transaction status changes',
    labelNames: ['from_status', 'to_status', 'payment_gateway'],
  });

  // Histograms
  private readonly paymentRequestDuration = new Histogram({
    name: 'payment_request_duration_seconds',
    help: 'Duration of payment requests in seconds',
    labelNames: ['payment_gateway', 'method'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });

  private readonly cacheOperationDuration = new Histogram({
    name: 'cache_operation_duration_seconds',
    help: 'Duration of cache operations in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  });

  // Gauges
  private readonly activePaymentSessions = new Gauge({
    name: 'active_payment_sessions',
    help: 'Number of active payment sessions',
    labelNames: ['payment_gateway'],
  });

  private readonly pendingTransactions = new Gauge({
    name: 'pending_transactions',
    help: 'Number of pending transactions',
    labelNames: ['payment_gateway'],
  });

  constructor() {
    // Register all metrics
    register.registerMetric(this.paymentRequestsTotal);
    register.registerMetric(this.paymentErrorsTotal);
    register.registerMetric(this.transactionStatusChanges);
    register.registerMetric(this.paymentRequestDuration);
    register.registerMetric(this.cacheOperationDuration);
    register.registerMetric(this.activePaymentSessions);
    register.registerMetric(this.pendingTransactions);

    this.logger.log('Payment metrics service initialized');
  }

  // Payment request metrics
  recordPaymentRequest(method: string, status: string, paymentGateway: string = 'sslcommerz') {
    this.paymentRequestsTotal.inc({ method, status, payment_gateway: paymentGateway });
  }

  recordPaymentError(errorType: string, paymentGateway: string = 'sslcommerz') {
    this.paymentErrorsTotal.inc({ error_type: errorType, payment_gateway: paymentGateway });
  }

  recordTransactionStatusChange(fromStatus: string, toStatus: string, paymentGateway: string = 'sslcommerz') {
    this.transactionStatusChanges.inc({ 
      from_status: fromStatus, 
      to_status: toStatus, 
      payment_gateway: paymentGateway 
    });
  }

  // Duration metrics
  startPaymentRequestTimer(paymentGateway: string = 'sslcommerz', method: string = 'unknown') {
    return this.paymentRequestDuration.startTimer({ payment_gateway: paymentGateway, method });
  }

  startCacheOperationTimer(operation: string) {
    return this.cacheOperationDuration.startTimer({ operation });
  }

  // Gauge metrics
  setActivePaymentSessions(count: number, paymentGateway: string = 'sslcommerz') {
    this.activePaymentSessions.set({ payment_gateway: paymentGateway }, count);
  }

  setPendingTransactions(count: number, paymentGateway: string = 'sslcommerz') {
    this.pendingTransactions.set({ payment_gateway: paymentGateway }, count);
  }

  // Utility methods
  async getMetrics(): Promise<string> {
    return await register.metrics();
  }

  async getMetricsAsJson(): Promise<any> {
    return await register.getMetricsAsJSON();
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    register.clear();
    this.logger.log('Metrics reset');
  }
}
