import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';

@Injectable()
export class PublicPackageService {
  private readonly logger = new Logger(PublicPackageService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===================
  // PUBLIC PACKAGE ACCESS
  // ===================

  async getActivePackages(featured?: boolean) {
    this.logger.log('Getting active packages for public access', { featured });
    
    const where: any = {
      status: 'ACTIVE' // Only show active packages
    };

    // If featured is true, only show popular packages
    if (featured) {
      where.isPopular = true;
    }

    const packages = await this.prisma.package.findMany({
      where,
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return packages.map(pkg => this.mapPackageForPublic(pkg));
  }

  async getPackageBySlug(slug: string) {
    this.logger.log('Getting package by slug for public access', { slug });
    
    // Note: The current Package model doesn't have a slug field
    // We'll use the name as a fallback, but ideally this should be updated
    const package_ = await this.prisma.package.findFirst({
      where: {
        name: slug, // Using name as slug for now
        status: 'ACTIVE' // Only allow access to active packages
      },
      include: {
        billingCycles: true,
        modules: {
          include: {
            module: true
          }
        }
      }
    });

    if (!package_) {
      throw new NotFoundException(`Package with slug "${slug}" not found or not active`);
    }

    return this.mapPackageForPublic(package_);
  }

  async getFeaturedPackages() {
    this.logger.log('Getting featured packages for public access');
    
    const packages = await this.prisma.package.findMany({
      where: {
        status: 'ACTIVE',
        isPopular: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return packages.map(pkg => this.mapPackageForPublic(pkg));
  }

  // ===================
  // HELPER METHODS
  // ===================

  private mapPackageForPublic(pkg: any) {
    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      packageType: pkg.packageType,
      isPopular: pkg.isPopular,
      maxMembers: pkg.maxMembers,
      unlimitedMembers: pkg.unlimitedMembers,
      additionalFeatures: pkg.additionalFeatures,
      status: pkg.status,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      // Include billing cycles
      billingCycles: pkg.billingCycles?.map((bc: any) => ({
        id: bc.id,
        months: bc.months,
        price: bc.price,
        discount: bc.discount,
        createdAt: bc.createdAt
      })) || [],
      // Include modules
      modules: pkg.modules?.map((pm: any) => ({
        id: pm.id,
        isEnabled: pm.isEnabled,
        createdAt: pm.createdAt,
        module: {
          id: pm.module.id,
          name: pm.module.name,
          icon: pm.module.icon,
          isActive: pm.module.isActive,
          createdAt: pm.module.createdAt,
          updatedAt: pm.module.updatedAt,
          createdBy: pm.module.createdBy
        }
      })) || []
    };
  }
}
