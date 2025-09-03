import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { 
  CouponEntity, 
  CreateCouponEntity, 
  UpdateCouponEntity 
} from '../entities/billing.entity';
import { CouponFilters, CouponValidation } from '../types/billing.types';

@Injectable()
export class CouponRepository {
  private readonly logger = new Logger(CouponRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCouponEntity): Promise<CouponEntity> {
    this.logger.log('Creating coupon', { 
      code: data.code, 
      type: data.type 
    });

    try {
      const coupon = await this.prisma.coupon.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log('Coupon created successfully', { 
        id: coupon.id,
        code: coupon.code 
      });

      return this.mapToEntity(coupon);
    } catch (error) {
      this.logger.error('Failed to create coupon', { 
        error: error.message,
        code: data.code 
      });
      throw error;
    }
  }

  async findAll(filters: CouponFilters = {}): Promise<{
    coupons: CouponEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('Finding coupons', { filters });

    const where: any = {};
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        include: {
          usages: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      coupons: coupons.map(coupon => this.mapToEntity(coupon)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<CouponEntity | null> {
    this.logger.log('Finding coupon by ID', { id });

    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: true,
      },
    });

    return coupon ? this.mapToEntity(coupon) : null;
  }

  async findByCode(code: string): Promise<CouponEntity | null> {
    this.logger.log('Finding coupon by code', { code });

    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: {
        usages: true,
      },
    });

    return coupon ? this.mapToEntity(coupon) : null;
  }

  async findActiveCoupons(): Promise<CouponEntity[]> {
    this.logger.log('Finding active coupons');

    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } },
        ],
      },
      include: {
        usages: true,
      },
    });

    return coupons.map(coupon => this.mapToEntity(coupon));
  }

  async update(id: string, data: UpdateCouponEntity): Promise<CouponEntity> {
    this.logger.log('Updating coupon', { 
      id, 
      updateFields: Object.keys(data) 
    });

    try {
      const coupon = await this.prisma.coupon.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          usages: true,
        },
      });

      this.logger.log('Coupon updated successfully', { id });
      return this.mapToEntity(coupon);
    } catch (error) {
      this.logger.error('Failed to update coupon', { 
        id, 
        error: error.message 
      });
      throw error;
    }
  }

  async validateCoupon(
    code: string, 
    companyId: string, 
    amount: number
  ): Promise<CouponValidation> {
    this.logger.log('Validating coupon', { code, companyId, amount });

    const coupon = await this.findByCode(code);
    
    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon not found',
      };
    }

    if (!coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon is not active',
      };
    }

    if (coupon.validUntil && coupon.validUntil < new Date()) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon has expired',
      };
    }

    if (coupon.minAmount && amount < coupon.minAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Minimum amount required: ${coupon.minAmount}`,
      };
    }

    if (coupon.maxDiscount && amount > coupon.maxDiscount) {
      return {
        isValid: false,
        discountAmount: 0,
        error: `Maximum discount allowed: ${coupon.maxDiscount}`,
      };
    }

    // Check usage limits
    const usageCount = await this.prisma.couponUsage.count({
      where: { couponId: coupon.id },
    });

    if (coupon.maxUses && usageCount >= coupon.maxUses) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon usage limit exceeded',
      };
    }

    // Check if company has already used this coupon
    const companyUsage = await this.prisma.couponUsage.findFirst({
      where: {
        couponId: coupon.id,
        companyId,
      },
    });

    if (coupon.maxUsesPerUser === 1 && companyUsage) {
      return {
        isValid: false,
        discountAmount: 0,
        error: 'Coupon can only be used once per company',
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (amount * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    return {
      isValid: true,
      coupon,
      discountAmount,
      finalAmount: amount - discountAmount,
    };
  }

  async recordUsage(
    couponId: string, 
    companyId: string, 
    invoiceId: string, 
    discountAmount: number
  ): Promise<void> {
    this.logger.log('Recording coupon usage', { 
      couponId, 
      companyId, 
      invoiceId 
    });

    await this.prisma.couponUsage.create({
      data: {
        couponId,
        companyId,
        invoiceId,
        discountAmount,
        usedAt: new Date(),
      },
    });

    this.logger.log('Coupon usage recorded successfully');
  }

  async getCouponStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
    totalDiscount: number;
  }> {
    this.logger.log('Getting coupon statistics');

    const [total, active, expired, totalUsage, totalDiscount] = await Promise.all([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({
        where: {
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gt: new Date() } },
          ],
        },
      }),
      this.prisma.coupon.count({
        where: {
          OR: [
            { isActive: false },
            { validUntil: { lt: new Date() } },
          ],
        },
      }),
      this.prisma.couponUsage.count(),
      this.prisma.couponUsage.aggregate({
        _sum: { discountAmount: true },
      }),
    ]);

    return {
      total,
      active,
      expired,
      totalUsage,
      totalDiscount: Number(totalDiscount._sum.discountAmount) || 0,
    };
  }

  async deactivateExpiredCoupons(): Promise<number> {
    this.logger.log('Deactivating expired coupons');

    const result = await this.prisma.coupon.updateMany({
      where: {
        isActive: true,
        validUntil: {
          lt: new Date(),
        },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    this.logger.log('Deactivated expired coupons', { count: result.count });
    return result.count;
  }

  private mapToEntity(data: any): CouponEntity {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      minAmount: data.minAmount,
      maxDiscount: data.maxDiscount,
      maxUses: data.maxUses,
      currentUses: data.currentUses,
      maxUsesPerUser: data.maxUsesPerUser,
      isOneTime: data.isOneTime,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      isActive: data.isActive,
      applicableOn: data.applicableOn,
      applicablePackages: data.applicablePackages,
      applicableMemberships: data.applicableMemberships,
      applicableServices: data.applicableServices,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
