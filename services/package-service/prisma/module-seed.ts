import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default modules for the Devsfit system
const defaultModules = [
  {
    name: 'members_management',
    icon: '/icons/members.svg',
    isActive: true,
  },
  {
    name: 'workout_planner',
    icon: '/icons/workout.svg',
    isActive: true,
  },
  {
    name: 'nutrition_tracker',
    icon: '/icons/nutrition.svg',
    isActive: true,
  },
  {
    name: 'payment_system',
    icon: '/icons/payment.svg',
    isActive: true,
  },
  {
    name: 'schedule_manager',
    icon: '/icons/schedule.svg',
    isActive: true,
  },
  {
    name: 'reports_analytics',
    icon: '/icons/analytics.svg',
    isActive: true,
  },
  {
    name: 'trainer_management',
    icon: '/icons/trainers.svg',
    isActive: true,
  },
  {
    name: 'equipment_tracking',
    icon: '/icons/equipment.svg',
    isActive: true,
  },
];

async function seedModules() {
  console.log('🌱 Seeding modules...');

  try {
    // Check if modules already exist
    const existingModules = await prisma.module.findMany();
    
    if (existingModules.length > 0) {
      console.log('⚠️  Modules already exist, skipping seed');
      return;
    }

    // Create modules
    const createdModules = await Promise.all(
      defaultModules.map(async (moduleData) => {
        return prisma.module.create({
          data: { ...moduleData, createdBy: 'System Admin' },
        });
      })
    );

    console.log(`✅ Created ${createdModules.length} modules:`);
    createdModules.forEach((module) => {
      console.log(`  - ${module.name}`);
    });

  } catch (error) {
    console.error('❌ Error seeding modules:', error);
    throw error;
  }
}

async function main() {
  await seedModules();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
