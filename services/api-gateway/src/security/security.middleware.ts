import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  // Rate limiting configuration
  private rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 15 * 60, // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      this.logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 15 * 60,
      });
    },
  });

  // Speed limiting (slow down responses)
  private speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes at full speed
    delayMs: 500, // slow down subsequent requests by 500ms per request
    maxDelayMs: 20000, // maximum delay of 20 seconds
  });

  // Strict rate limiting for auth endpoints
  private authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many login attempts. Please try again later.',
      retryAfter: 15 * 60,
    },
    handler: (req, res) => {
      this.logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: 15 * 60,
      });
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply different rate limits based on path
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      this.authRateLimiter(req, res, (err) => {
        if (err) return next(err);
        this.applySecurityHeaders(req, res, next);
      });
    } else {
      this.rateLimiter(req, res, (err) => {
        if (err) return next(err);
        this.speedLimiter(req, res, (err) => {
          if (err) return next(err);
          this.applySecurityHeaders(req, res, next);
        });
      });
    }
  }

  private applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remove server identification
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'Devsfit-Gateway');

    // Log suspicious requests
    this.logSuspiciousActivity(req);

    next();
  }

  private logSuspiciousActivity(req: Request) {
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /exec\(/i,  // Code execution
      /eval\(/i,  // Code evaluation
    ];

    const fullUrl = req.originalUrl || req.url;
    const body = JSON.stringify(req.body);
    
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(fullUrl) || pattern.test(body)) {
        this.logger.warn(`Suspicious request detected from ${req.ip}: ${req.method} ${fullUrl}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: fullUrl,
          body: req.body,
        });
      }
    });
  }
}
