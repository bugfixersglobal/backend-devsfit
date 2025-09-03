import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, userAgent } = request;
    const user = request.user?.id || 'anonymous';
    const startTime = Date.now();

    this.logger.log(
      `🚀 ${method} ${url} - User: ${user} - IP: ${ip} - UA: ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.logger.log(
            `✅ ${method} ${url} - ${duration}ms - User: ${user}`,
          );
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.logger.error(
            `❌ ${method} ${url} - ${duration}ms - User: ${user} - Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
