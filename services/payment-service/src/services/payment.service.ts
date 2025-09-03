import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PaymentCompletedEvent } from '../dto/payment.dto';
import { PaymentStatus, RefundStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPaymentRecord(data: {
    transactionId: string;
    companyId: string;
    amount: number;
    currency: string;
    status: string;
    paymentData: any;
  }) {
    this.logger.log('Creating payment record', { transactionId: data.transactionId });
    
    return await this.prisma.payment.create({
      data: {
        transactionId: data.transactionId,
        companyId: data.companyId,
        amount: data.amount,
        currency: data.currency,
        status: data.status as PaymentStatus,
        paymentData: data.paymentData,
        paymentDate: new Date(),
      },
    });
  }

  async updatePaymentStatus(
    transactionId: string,
    status: string,
    additionalData: any = {}
  ) {
    this.logger.log('Updating payment status', { transactionId, status });
    
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'COMPLETED') {
      updateData.paymentDate = new Date();
    }

    // Add additional data
    Object.assign(updateData, additionalData);

    return await this.prisma.payment.update({
      where: { transactionId },
      data: updateData,
    });
  }

  async getPaymentByTransactionId(transactionId: string) {
    this.logger.log('Getting payment by transaction ID', { transactionId });
    
    return await this.prisma.payment.findUnique({
      where: { transactionId },
    });
  }

  async getPaymentHistory(companyId: string) {
    this.logger.log('Getting payment history', { companyId });
    
    return await this.prisma.payment.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRefundRecord(data: {
    transactionId: string;
    originalPaymentId: string;
    amount: number;
    reason: string;
    refundId: string;
    status: string;
  }) {
    this.logger.log('Creating refund record', { 
      transactionId: data.transactionId,
      refundId: data.refundId 
    });
    
    return await this.prisma.refund.create({
      data: {
        transactionId: data.transactionId,
        originalPaymentId: data.originalPaymentId,
        amount: data.amount,
        reason: data.reason,
        refundId: data.refundId,
        status: data.status as RefundStatus,
        refundDate: new Date(),
      },
    });
  }

  async emitPaymentCompletedEvent(eventData: PaymentCompletedEvent) {
    this.logger.log('Emitting payment completed event', { 
      transactionId: eventData.transactionId,
      companyId: eventData.companyId 
    });
    
    // In a real implementation, this would emit an event to a message queue
    // For now, we'll log the event
    this.logger.log('Payment completed event:', {
      event: 'payment.completed',
      data: eventData,
      timestamp: new Date().toISOString(),
    });

    // TODO: Implement actual event emission
    // await this.eventEmitter.emit('payment.completed', eventData);
  }

  async getPaymentAnalytics(companyId?: string) {
    this.logger.log('Getting payment analytics', { companyId });
    
    const whereClause = companyId ? { companyId } : {};
    
    const totalPayments = await this.prisma.payment.count({
      where: whereClause,
    });

    const completedPayments = await this.prisma.payment.count({
      where: { ...whereClause, status: 'COMPLETED' },
    });

    const totalAmount = await this.prisma.payment.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const recentPayments = await this.prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalPayments,
      completedPayments,
      failedPayments: totalPayments - completedPayments,
      totalAmount: totalAmount._sum.amount || 0,
      successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
      recentPayments,
    };
  }

  async getRefundHistory(companyId: string) {
    this.logger.log('Getting refund history', { companyId });
    
    return await this.prisma.refund.findMany({
      where: { 
        originalPayment: { companyId } 
      },
      include: {
        originalPayment: true,
      },
      orderBy: { refundDate: 'desc' },
    });
  }

  async checkPaymentHealth() {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Payment service health check failed', error);
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
