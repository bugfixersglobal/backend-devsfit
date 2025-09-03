import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

export interface LogContext {
  method: string;
  url: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  duration: number;
  statusCode?: number;
  error?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    // Safely extract user ID with proper null checking
    let userId: string | undefined;
    try {
      userId = user && typeof user === 'object' && 'id' in user ? (user as any).id : undefined;
    } catch (error) {
      userId = undefined;
    }

    const logContext: Omit<LogContext, 'duration'> = {
      method,
      url,
      userId,
      ip: request.ip || 'unknown',
      userAgent: request.headers['user-agent'],
    };

    this.logger.log('Request started', {
      ...logContext,
      body: this.sanitizeBody(body),
      headers: this.sanitizeHeaders(request.headers),
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logger.log('Request completed', {
          ...logContext,
          duration,
          statusCode: 200,
          responseSize: this.getResponseSize(data),
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error('Request failed', {
          ...logContext,
          duration,
          statusCode: error.status || 500,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'refreshToken',
      'accessToken',
      'authorization',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getResponseSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
} 