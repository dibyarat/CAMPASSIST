import { Injectable, ExecutionContext, HttpStatus, HttpException } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

/**
 * AppThrottlerGuard extends NestJS ThrottlerGuard to enforce:
 * 1. Safe IP resolution behind Render's single-hop reverse proxy load balancer (via req.ip).
 * 2. Guaranteed exemption for health monitoring endpoints (/api/v1/health, @SkipThrottle()).
 * 3. Consistent, non-sensitive JSON error response for HTTP 429 across all endpoints.
 * 4. Prevention of internal stack trace or credential leakage.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  /**
   * Bypasses throttling completely if:
   * - The route or controller is decorated with @SkipThrottle()
   * - The request targets the health monitoring endpoints (/health, /api/v1/health)
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check if @SkipThrottle() is applied on method or class
    for (const namedThrottler of this.throttlers || []) {
      const skip = this.reflector.getAllAndOverride(`THROTTLER:SKIP${namedThrottler.name}`, [handler, classRef]);
      if (skip) return true;
    }

    // Default skip metadata check (when @SkipThrottle() is used without arguments)
    const skipDefault = this.reflector.getAllAndOverride('THROTTLER:SKIPdefault', [handler, classRef]);
    if (skipDefault) return true;

    // Health check endpoint URL bypass (strictly exact path, ignoring query strings)
    const req = context.switchToHttp().getRequest();
    const rawUrl = String(req?.url || req?.originalUrl || req?.path || '');
    const pathname = rawUrl.split('?')[0];
    if (pathname === '/health' || pathname === '/api/v1/health') {
      return true;
    }

    return false;
  }

  /**
   * Overrides the exception raised on throttled requests to return a standardized,
   * non-sensitive JSON payload matching the platform specification:
   * { statusCode: 429, error: 'Too Many Requests', message: 'Too many requests from this client, please try again later.' }
   */
  protected async throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Too many requests from this client, please try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
