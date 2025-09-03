import { PrismaClient, UserStatus, AuthProvider } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const permissions = [
    // User management
    { name: 'user:create', description: 'Create users', resource: 'user', action: 'create' },
    { name: 'user:read', description: 'Read users', resource: 'user', action: 'read' },
    { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
    { name: 'user:delete', description: 'Delete users', resource: 'user', action: 'delete' },

    // Company management
    { name: 'company:create', description: 'Create companies', resource: 'company', action: 'create' },
    { name: 'company:read', description: 'Read companies', resource: 'company', action: 'read' },
    { name: 'company:update', description: 'Update companies', resource: 'company', action: 'update' },
    { name: 'company:delete', description: 'Delete companies', resource: 'company', action: 'delete' },

    // Package management
    { name: 'package:create', description: 'Create packages', resource: 'package', action: 'create' },
    { name: 'package:read', description: 'Read packages', resource: 'package', action: 'read' },
    { name: 'package:update', description: 'Update packages', resource: 'package', action: 'update' },
    { name: 'package:delete', description: 'Delete packages', resource: 'package', action: 'delete' },

    // Attendance management
    { name: 'attendance:create', description: 'Create attendance', resource: 'attendance', action: 'create' },
    { name: 'attendance:read', description: 'Read attendance', resource: 'attendance', action: 'read' },
    { name: 'attendance:update', description: 'Update attendance', resource: 'attendance', action: 'update' },
    { name: 'attendance:delete', description: 'Delete attendance', resource: 'attendance', action: 'delete' },

    // Payment management
    { name: 'payment:create', description: 'Create payments', resource: 'payment', action: 'create' },
    { name: 'payment:read', description: 'Read payments', resource: 'payment', action: 'read' },
    { name: 'payment:update', description: 'Update payments', resource: 'payment', action: 'update' },
    { name: 'payment:delete', description: 'Delete payments', resource: 'payment', action: 'delete' },

    // Report management
    { name: 'report:create', description: 'Create reports', resource: 'report', action: 'create' },
    { name: 'report:read', description: 'Read reports', resource: 'report', action: 'read' },
    { name: 'report:update', description: 'Update reports', resource: 'report', action: 'update' },
    { name: 'report:delete', description: 'Delete reports', resource: 'report', action: 'delete' },
  ];

  console.log('Creating permissions...');
  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    createdPermissions.push(created);
  }

  // Create roles
  const roles = [
    {
      name: 'super_admin',
      description: 'Super administrator with full access',
      isSystem: true,
      permissions: createdPermissions.map(p => p.id), // All permissions
    },
    {
      name: 'admin',
      description: 'Administrator with limited access',
      isSystem: true,
      permissions: createdPermissions.filter(p => 
        !p.name.includes('delete') || p.resource === 'user'
      ).map(p => p.id),
    },
    {
      name: 'manager',
      description: 'Gym manager',
      isSystem: false,
      permissions: createdPermissions.filter(p => 
        ['user:read', 'company:read', 'package:read', 'attendance:create', 'attendance:read', 'payment:read', 'report:read'].includes(p.name)
      ).map(p => p.id),
    },
    {
      name: 'trainer',
      description: 'Gym trainer',
      isSystem: false,
      permissions: createdPermissions.filter(p => 
        ['attendance:create', 'attendance:read', 'user:read'].includes(p.name)
      ).map(p => p.id),
    },
    {
      name: 'member',
      description: 'Gym member',
      isSystem: false,
      permissions: createdPermissions.filter(p => 
        ['attendance:read', 'package:read'].includes(p.name)
      ).map(p => p.id),
    },
  ];

  console.log('Creating roles...');
  for (const roleData of roles) {
    const { permissions: permissionIds, ...roleInfo } = roleData;
    
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleInfo,
    });

    // Create role-permission relationships
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionId,
        },
      });
    }
  }

  // Create default super admin user
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'super_admin' },
  });

  if (superAdminRole) {
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@devsfit.com' },
      update: {},
      create: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@devsfit.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        status: UserStatus.ACTIVE,
        emailVerified: true,
        authProvider: AuthProvider.LOCAL,
      },
    });

    // Assign super admin role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });

    console.log('✅ Default super admin user created: admin@devsfit.com (password: password)');
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 