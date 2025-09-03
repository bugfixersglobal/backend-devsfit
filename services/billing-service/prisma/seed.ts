import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting billing service database seeding...');

  // Create default invoice statuses
  console.log('📊 Creating default invoice statuses...');
  
  // Create default coupon codes
  console.log('🎫 Creating default coupon codes...');
  
  const defaultCoupons = [
    {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      description: 'Welcome discount - 10% off',
      type: 'PERCENTAGE' as const,
      value: 10,
      minAmount: 50,
      maxDiscount: 100,
      maxUses: 1000,
      currentUses: 0,
      maxUsesPerUser: 1,
      isOneTime: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      applicableOn: 'PACKAGES' as const,
      applicablePackages: null,
      applicableMemberships: null,
      applicableServices: null,
    },
    {
      code: 'SAVE20',
      name: 'Annual Savings',
      description: 'Save 20% on annual subscriptions',
      type: 'PERCENTAGE' as const,
      value: 20,
      minAmount: 200,
      maxDiscount: 500,
      maxUses: 500,
      currentUses: 0,
      maxUsesPerUser: 1,
      isOneTime: false,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      isActive: true,
      applicableOn: 'MEMBERSHIPS' as const,
      applicablePackages: null,
      applicableMemberships: null,
      applicableServices: null,
    },
    {
      code: 'FLAT50',
      name: 'Flat Discount',
      description: 'Flat $50 discount',
      type: 'FIXED_AMOUNT' as const,
      value: 50,
      minAmount: 100,
      maxDiscount: 50,
      maxUses: 200,
      currentUses: 0,
      maxUsesPerUser: 1,
      isOneTime: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      applicableOn: 'SERVICES' as const,
      applicablePackages: null,
      applicableMemberships: null,
      applicableServices: null,
    },
  ];

  for (const couponData of defaultCoupons) {
    await prisma.coupon.upsert({
      where: { code: couponData.code },
      update: {},
      create: couponData,
    });
  }

  console.log('✅ Default coupon codes created');

  // Create default tax rates
  console.log('💰 Creating default tax rates...');
  
  const defaultTaxRates = [
    {
      country: 'US',
      state: 'CA',
      rate: 0.0725,
      name: 'California State Tax',
      description: 'California State Tax',
      isActive: true,
    },
    {
      country: 'US',
      state: 'NY',
      rate: 0.08875,
      name: 'New York State Tax',
      description: 'New York State Tax',
      isActive: true,
    },
    {
      country: 'CA',
      state: 'ON',
      rate: 0.13,
      name: 'Ontario HST',
      description: 'Ontario HST',
      isActive: true,
    },
    {
      country: 'GB',
      state: '',
      rate: 0.20,
      name: 'UK VAT',
      description: 'UK VAT',
      isActive: true,
    },
  ];

  for (const taxData of defaultTaxRates) {
    await prisma.taxRate.upsert({
      where: { 
        id: `${taxData.country}-${taxData.state || 'default'}`
      },
      update: {},
      create: {
        ...taxData,
        id: `${taxData.country}-${taxData.state || 'default'}`,
      },
    });
  }

  console.log('✅ Default tax rates created');

  console.log('🎉 Billing service database seeding completed successfully!');

  console.log('🎉 Billing service database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
