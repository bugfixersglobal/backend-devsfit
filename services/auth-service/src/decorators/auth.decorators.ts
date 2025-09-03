import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../types/user.types';

// Public route decorator
export const Public = () => SetMetadata('isPublic', true);

// Roles decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Permissions decorator
export const Permissions = (...permissions: string[]) => SetMetadata('permissions', permissions);

// Current user decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Get user ID decorator
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

// Get client IP decorator
export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip || request.connection.remoteAddress || request.headers['x-forwarded-for'];
  },
);

// Get user agent decorator
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
  },
); 