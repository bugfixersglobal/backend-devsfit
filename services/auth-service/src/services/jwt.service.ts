import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import authConfig from '../config/auth.config';
import { UserWithRoles, JwtPayload, UserProfile } from '../types/user.types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  /**
   * Generate access token with RS256 algorithm
   */
  generateAccessToken(user: UserWithRoles | UserProfile, jwtId?: string): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: this.extractRoles(user),
      permissions: this.extractPermissions(user),
      iat: Math.floor(Date.now() / 1000),
      iss: this.config.jwt.issuer,
      aud: this.config.jwt.audience,
      jti: jwtId || this.generateJwtId(),
    };

    return jwt.sign(payload, this.config.jwt.privateKey, {
      algorithm: this.config.jwt.algorithm as jwt.Algorithm,
      expiresIn: this.config.jwt.accessTokenExpiry,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string, jwtId?: string): string {
    const payload = {
      sub: userId,
      type: 'refresh',
      jti: jwtId || this.generateJwtId(),
    };

    return jwt.sign(payload, this.config.jwt.privateKey, {
      algorithm: this.config.jwt.algorithm as jwt.Algorithm,
      expiresIn: this.config.jwt.refreshTokenExpiry,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(user: UserWithRoles | UserProfile): TokenPair {
    const jwtId = this.generateJwtId();
    const accessToken = this.generateAccessToken(user, jwtId);
    const refreshToken = this.generateRefreshToken(user.id, jwtId);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiryInSeconds(),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.config.jwt.publicKey, {
        algorithms: [this.config.jwt.algorithm as jwt.Algorithm],
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience,
      }) as JwtPayload;
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwt.publicKey, {
        algorithms: [this.config.jwt.algorithm as jwt.Algorithm],
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Decode token without verification (for expired tokens)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiry date
   */
  getTokenExpiry(token: string): Date {
    const decoded = jwt.decode(token) as any;
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Extract roles from user
   */
  private extractRoles(user: UserWithRoles | UserProfile): string[] {
    if ('permissions' in user) {
      // UserProfile case - roles is already string[]
      return user.roles;
    } else {
      // UserWithRoles case - need to extract role names
      return user.roles?.map((userRole) => userRole.role.name) || [];
    }
  }

  /**
   * Extract permissions from user roles
   */
  private extractPermissions(user: UserWithRoles | UserProfile): string[] {
    if ('permissions' in user && Array.isArray(user.permissions)) {
      // UserProfile case - permissions is already string[]
      return user.permissions;
    } else if ('roles' in user && Array.isArray(user.roles)) {
      // UserWithRoles case - need to extract permissions from roles
      const permissions = new Set<string>();
      
      user.roles?.forEach((userRole) => {
        userRole.role.permissions?.forEach((rolePermission) => {
          permissions.add(rolePermission.permission.name);
        });
      });

      return Array.from(permissions);
    }
    return [];
  }

  /**
   * Generate unique JWT ID
   */
  private generateJwtId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get access token expiry in seconds (handles both string and number configs)
   */
  private getAccessTokenExpiryInSeconds(): number {
    const expiry = this.config.jwt.accessTokenExpiry;
    
    // The config already parses this as a number, so just return it
    return expiry;
  }
} 