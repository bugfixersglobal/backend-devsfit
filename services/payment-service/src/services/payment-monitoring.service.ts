import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PaymentMonitoringData {
  transactionId: string;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  amount: number;
  currency: string;
  userId?: string;
  companyId?: string;
  packageId?: string;
  timestamp: Date;
  duration?: number; // in milliseconds
  errorMessage?: string;
  gatewayResponse?: any;
  metadata?: any;
}

export interface PaymentMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  cancelledTransactions: number;
  averageProcessingTime: number;
  successRate: number;
  totalAmount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

@Injectable()
export class PaymentMonitoringService {
  private readonly logger = new Logger(PaymentMonitoringService.name);
  private paymentLogs: Map<string, PaymentMonitoringData> = new Map();
  private readonly maxLogRetention = 10000; // Keep last 10k transactions in memory

  constructor(private readonly configService: ConfigService) {}

  /**
   * Log payment initiation
   */
  logPaymentInitiation(data: {
    transactionId: string;
    amount: number;
    currency: string;
    userId?: string;
    companyId?: string;
    packageId?: string;
    metadata?: any;
  }): void {
    const monitoringData: PaymentMonitoringData = {
      transactionId: data.transactionId,
      status: 'INITIATED',
      amount: data.amount,
      currency: data.currency,
      userId: data.userId,
      companyId: data.companyId,
      packageId: data.packageId,
      timestamp: new Date(),
      metadata: data.metadata
    };

    this.storePaymentLog(monitoringData);
    
    this.logger.log('Payment initiated', {
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      customer: data.userId,
      company: data.companyId
    });
  }

  /**
   * Log payment success
   */
  logPaymentSuccess(data: {
    transactionId: string;
    duration?: number;
    gatewayResponse?: any;
  }): void {
    const existingLog = this.paymentLogs.get(data.transactionId);
    if (existingLog) {
      existingLog.status = 'SUCCESS';
      existingLog.duration = data.duration || this.calculateDuration(existingLog.timestamp);
      existingLog.gatewayResponse = data.gatewayResponse;
      
      this.logger.log('Payment successful', {
        transactionId: data.transactionId,
        duration: existingLog.duration,
        amount: existingLog.amount,
        currency: existingLog.currency
      });
    }
  }

  /**
   * Log payment failure
   */
  logPaymentFailure(data: {
    transactionId: string;
    errorMessage: string;
    duration?: number;
    gatewayResponse?: any;
  }): void {
    const existingLog = this.paymentLogs.get(data.transactionId);
    if (existingLog) {
      existingLog.status = 'FAILED';
      existingLog.duration = data.duration || this.calculateDuration(existingLog.timestamp);
      existingLog.errorMessage = data.errorMessage;
      existingLog.gatewayResponse = data.gatewayResponse;
      
      this.logger.error('Payment failed', {
        transactionId: data.transactionId,
        error: data.errorMessage,
        duration: existingLog.duration,
        amount: existingLog.amount
      });
    }
  }

  /**
   * Log payment cancellation
   */
  logPaymentCancellation(data: {
    transactionId: string;
    duration?: number;
  }): void {
    const existingLog = this.paymentLogs.get(data.transactionId);
    if (existingLog) {
      existingLog.status = 'CANCELLED';
      existingLog.duration = data.duration || this.calculateDuration(existingLog.timestamp);
      
      this.logger.warn('Payment cancelled', {
        transactionId: data.transactionId,
        duration: existingLog.duration,
        amount: existingLog.amount
      });
    }
  }

  /**
   * Log payment timeout
   */
  logPaymentTimeout(transactionId: string): void {
    const existingLog = this.paymentLogs.get(transactionId);
    if (existingLog) {
      existingLog.status = 'TIMEOUT';
      existingLog.duration = this.calculateDuration(existingLog.timestamp);
      existingLog.errorMessage = 'Payment timeout';
      
      this.logger.error('Payment timeout', {
        transactionId,
        duration: existingLog.duration,
        amount: existingLog.amount
      });
    }
  }

  /**
   * Get payment metrics for monitoring dashboard
   */
  getPaymentMetrics(timeRange?: { start: Date; end: Date }): PaymentMetrics {
    const logs = Array.from(this.paymentLogs.values());
    
    // Filter by time range if provided
    const filteredLogs = timeRange 
      ? logs.filter(log => log.timestamp >= timeRange.start && log.timestamp <= timeRange.end)
      : logs;

    const totalTransactions = filteredLogs.length;
    const successfulTransactions = filteredLogs.filter(log => log.status === 'SUCCESS').length;
    const failedTransactions = filteredLogs.filter(log => log.status === 'FAILED').length;
    const cancelledTransactions = filteredLogs.filter(log => log.status === 'CANCELLED').length;
    
    const completedTransactions = filteredLogs.filter(log => log.duration !== undefined);
    const averageProcessingTime = completedTransactions.length > 0
      ? completedTransactions.reduce((sum, log) => sum + (log.duration || 0), 0) / completedTransactions.length
      : 0;

    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    const totalAmount = filteredLogs.reduce((sum, log) => sum + log.amount, 0);

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      cancelledTransactions,
      averageProcessingTime,
      successRate,
      totalAmount,
      timeRange: timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      }
    };
  }

  /**
   * Get detailed payment logs
   */
  getPaymentLogs(filters?: {
    status?: PaymentMonitoringData['status'];
    userId?: string;
    companyId?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }): PaymentMonitoringData[] {
    let logs = Array.from(this.paymentLogs.values());

    // Apply filters
    if (filters) {
      if (filters.status) {
        logs = logs.filter(log => log.status === filters.status);
      }
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.companyId) {
        logs = logs.filter(log => log.companyId === filters.companyId);
      }
      if (filters.timeRange) {
        logs = logs.filter(log => 
          log.timestamp >= filters.timeRange!.start && 
          log.timestamp <= filters.timeRange!.end
        );
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Check for payment timeouts and alert
   */
  checkPaymentTimeouts(): void {
    const timeoutThreshold = 30 * 60 * 1000; // 30 minutes
    const now = new Date();

    this.paymentLogs.forEach((log, transactionId) => {
      if (log.status === 'INITIATED') {
        const timeSinceInitiation = now.getTime() - log.timestamp.getTime();
        
        if (timeSinceInitiation > timeoutThreshold) {
          this.logPaymentTimeout(transactionId);
          
          // You could also send alerts here
          this.sendTimeoutAlert(log);
        }
      }
    });
  }

  /**
   * Generate payment monitoring report
   */
  generateMonitoringReport(): {
    summary: PaymentMetrics;
    recentFailures: PaymentMonitoringData[];
    topPerformingPackages: { packageId: string; successCount: number; totalAmount: number }[];
    alertsAndWarnings: string[];
  } {
    const summary = this.getPaymentMetrics();
    const recentFailures = this.getPaymentLogs({
      status: 'FAILED',
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      },
      limit: 10
    });

    // Calculate top performing packages
    const packageStats = new Map<string, { successCount: number; totalAmount: number }>();
    this.getPaymentLogs({ status: 'SUCCESS' }).forEach(log => {
      if (log.packageId) {
        const existing = packageStats.get(log.packageId) || { successCount: 0, totalAmount: 0 };
        existing.successCount++;
        existing.totalAmount += log.amount;
        packageStats.set(log.packageId, existing);
      }
    });

    const topPerformingPackages = Array.from(packageStats.entries())
      .map(([packageId, stats]) => ({ packageId, ...stats }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    // Generate alerts and warnings
    const alertsAndWarnings: string[] = [];
    
    if (summary.successRate < 90) {
      alertsAndWarnings.push(`Low success rate: ${summary.successRate.toFixed(1)}%`);
    }
    
    if (summary.averageProcessingTime > 10000) { // 10 seconds
      alertsAndWarnings.push(`High average processing time: ${(summary.averageProcessingTime / 1000).toFixed(1)}s`);
    }
    
    if (recentFailures.length > 5) {
      alertsAndWarnings.push(`High number of recent failures: ${recentFailures.length}`);
    }

    return {
      summary,
      recentFailures,
      topPerformingPackages,
      alertsAndWarnings
    };
  }

  private storePaymentLog(data: PaymentMonitoringData): void {
    this.paymentLogs.set(data.transactionId, data);
    
    // Clean up old logs if we exceed max retention
    if (this.paymentLogs.size > this.maxLogRetention) {
      const oldestEntries = Array.from(this.paymentLogs.entries())
        .sort(([,a], [,b]) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, this.paymentLogs.size - this.maxLogRetention);
      
      oldestEntries.forEach(([transactionId]) => {
        this.paymentLogs.delete(transactionId);
      });
    }
  }

  private calculateDuration(startTime: Date): number {
    return Date.now() - startTime.getTime();
  }

  private sendTimeoutAlert(log: PaymentMonitoringData): void {
    // Implement your alerting mechanism here
    // Could send to Slack, email, monitoring service, etc.
    this.logger.error('Payment timeout alert', {
      transactionId: log.transactionId,
      amount: log.amount,
      userId: log.userId,
      companyId: log.companyId,
      initiatedAt: log.timestamp
    });
  }
}
