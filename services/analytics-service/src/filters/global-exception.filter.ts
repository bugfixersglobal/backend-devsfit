import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

// Extend Request interface to include user property
interface RequestWithUser extends Request {
  user?: any;
}

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error?: string;
  details?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);
    const error = this.getErrorDetails(exception);

    // Log the error with context
    this.logger.error('Exception occurred', {
      status,
      message,
      path: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: request.user?.id,
      body: this.sanitizeBody(request.body),
      error: error?.stack || error?.message,
    });

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: error?.stack }),
      ...(process.env.NODE_ENV === 'development' && { details: error }),
    };

    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return HttpStatus.CONFLICT;
        case 'P2025':
          return HttpStatus.NOT_FOUND;
        case 'P2003':
          return HttpStatus.BAD_REQUEST;
        default:
          return HttpStatus.BAD_REQUEST;
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.message;
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return 'Resource already exists';
        case 'P2025':
          return 'Resource not found';
        case 'P2003':
          return 'Invalid data provided';
        default:
          return 'Database operation failed';
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return 'Validation error';
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return 'Database error';
    }

    return 'Internal server error';
  }

  private getErrorDetails(exception: unknown): any {
    if (exception instanceof HttpException) {
      return exception;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        code: exception.code,
        meta: exception.meta,
        clientVersion: exception.clientVersion,
      };
    }

    return exception;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
