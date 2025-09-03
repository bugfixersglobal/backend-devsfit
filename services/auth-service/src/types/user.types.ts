import { UserStatus, AuthProvider } from '@prisma/client';

// Base User interface matching Prisma schema
export interface User {
  id: string;
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  authProvider: AuthProvider;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  profilePicture?: string;
  timezone: string;
  locale: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  googleId?: string;
  facebookId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User with roles and permissions (for auth context)
export interface UserWithRoles extends User {
  roles: UserRole[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: RolePermission[];
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

// Simplified user profile for API responses
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

// JWT payload interface
export interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp?: number; // optional because jwt.sign() will add it automatically
  jti?: string;
  iss?: string; // issuer
  aud?: string; // audience
}

// Request user (attached by JWT strategy)
export interface RequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
} 