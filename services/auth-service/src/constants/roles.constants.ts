export enum RoleCategory {
  PLATFORM_ROLES = 'PLATFORM_ROLES',
  BUSINESS_ROLES = 'BUSINESS_ROLES', 
  STAFF_ROLES = 'STAFF_ROLES',
  MEMBER_ROLES = 'MEMBER_ROLES'
}

export enum RoleLevel {
  GUEST = 0,
  MEMBER = 1,
  STAFF = 2,
  MANAGER = 3,
  ADMIN = 4,
  SUPER_ADMIN = 5
}

export const PROFESSIONAL_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    description: 'Platform-level administrator with full system access',
    category: RoleCategory.PLATFORM_ROLES,
    level: RoleLevel.SUPER_ADMIN,
    isSystem: true
  },
  SYSTEM_ADMIN: {
    name: 'SYSTEM_ADMIN',
    description: 'System administrator with technical management access',
    category: RoleCategory.PLATFORM_ROLES,
    level: RoleLevel.ADMIN,
    isSystem: true
  },
  COMPANY_OWNER: {
    name: 'COMPANY_OWNER',
    description: 'Company owner with full business access',
    category: RoleCategory.BUSINESS_ROLES,
    level: RoleLevel.ADMIN,
    isSystem: false
  },
  FACILITY_MANAGER: {
    name: 'FACILITY_MANAGER',
    description: 'Gym facility manager with operational control',
    category: RoleCategory.BUSINESS_ROLES,
    level: RoleLevel.MANAGER,
    isSystem: false
  },
  HEAD_TRAINER: {
    name: 'HEAD_TRAINER',
    description: 'Senior trainer with team management',
    category: RoleCategory.STAFF_ROLES,
    level: RoleLevel.MANAGER,
    isSystem: false
  },
  PERSONAL_TRAINER: {
    name: 'PERSONAL_TRAINER',
    description: 'Personal trainer with member management',
    category: RoleCategory.STAFF_ROLES,
    level: RoleLevel.STAFF,
    isSystem: false
  },
  RECEPTIONIST: {
    name: 'RECEPTIONIST',
    description: 'Front desk staff with member services',
    category: RoleCategory.STAFF_ROLES,
    level: RoleLevel.STAFF,
    isSystem: false
  },
  MEMBER: {
    name: 'MEMBER',
    description: 'Regular gym member with full access',
    category: RoleCategory.MEMBER_ROLES,
    level: RoleLevel.MEMBER,
    isSystem: false
  },
  GUEST: {
    name: 'GUEST',
    description: 'Temporary access user with limited permissions',
    category: RoleCategory.MEMBER_ROLES,
    level: RoleLevel.GUEST,
    isSystem: false
  }
} as const;

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // All permissions
  SYSTEM_ADMIN: [
    'user:*', 'role:*', 'permission:*', 'company:*', 'package:*',
    'attendance:*', 'payment:*', 'report:*', 'notification:*', 'file:*'
  ],
  COMPANY_OWNER: [
    'user:read', 'user:create', 'user:update',
    'company:read', 'company:update',
    'package:read', 'attendance:*', 'payment:*', 'report:*'
  ],
  FACILITY_MANAGER: [
    'user:read', 'user:create', 'user:update',
    'attendance:create', 'attendance:read', 'attendance:update',
    'payment:read', 'report:read'
  ],
  HEAD_TRAINER: [
    'user:read', 'attendance:create', 'attendance:read', 'attendance:update',
    'report:read'
  ],
  PERSONAL_TRAINER: [
    'user:read', 'attendance:create', 'attendance:read'
  ],
  RECEPTIONIST: [
    'user:read', 'user:create', 'user:update',
    'attendance:create', 'attendance:read',
    'payment:create', 'payment:read'
  ],
  MEMBER: [
    'attendance:read', 'package:read'
  ],
  GUEST: [
    'package:read'
  ]
} as const;

export const ROLE_HIERARCHY = {
  [RoleLevel.SUPER_ADMIN]: [RoleLevel.ADMIN, RoleLevel.MANAGER, RoleLevel.STAFF, RoleLevel.MEMBER, RoleLevel.GUEST],
  [RoleLevel.ADMIN]: [RoleLevel.MANAGER, RoleLevel.STAFF, RoleLevel.MEMBER, RoleLevel.GUEST],
  [RoleLevel.MANAGER]: [RoleLevel.STAFF, RoleLevel.MEMBER, RoleLevel.GUEST],
  [RoleLevel.STAFF]: [RoleLevel.MEMBER, RoleLevel.GUEST],
  [RoleLevel.MEMBER]: [RoleLevel.GUEST],
  [RoleLevel.GUEST]: []
} as const;
