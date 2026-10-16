import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, SkipThrottle, Throttle } from '@nestjs/throttler';
import { Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { AppThrottlerGuard } from './app-throttler.guard';

@Controller('test')
class TestController {
  @Get('general')
  general() {
    return { ok: true };
  }

  @SkipThrottle()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('limited')
  limited() {
    return { ok: true };
  }

  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('sensitive')
  sensitive() {
    return { sensitive: true };
  }
}

function createMockContext(method: string, url: string, ip: string, handler: Function, classRef: Function = TestController): any {
  const req = {
    method,
    url,
    originalUrl: url,
    ip,
    headers: {
      'x-forwarded-for': ip,
    },
  };
  const res = {
    header: () => {},
    setHeader: () => {},
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => handler,
    getClass: () => classRef,
  };
}

describe('CampusAssist AppThrottlerGuard Suite', () => {
  let guard: AppThrottlerGuard;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        AppThrottlerGuard,
      ],
    }).compile();

    await moduleRef.init();
    guard = moduleRef.get<AppThrottlerGuard>(AppThrottlerGuard);
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('1. Requests below limit succeed (guard returns true)', async () => {
    const context = createMockContext('GET', '/test/general', '198.51.100.1', TestController.prototype.general);
    const result1 = await guard.canActivate(context);
    const result2 = await guard.canActivate(context);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });

  it('2. Requests exceeding limit throw HttpException 429 with consistent non-sensitive JSON', async () => {
    const ip = '198.51.100.2';
    const context = createMockContext('POST', '/test/limited', ip, TestController.prototype.limited);

    // limit is 2 on this endpoint
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);

    // 3rd request must throw 429
    let error: any;
    try {
      await guard.canActivate(context);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error.getResponse()).toEqual({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests from this client, please try again later.',
    });
    // Ensure no internal details leaked
    expect(error.getResponse().stack).toBeUndefined();
    expect(error.getResponse().details).toBeUndefined();
  });

  it('3. Health check endpoints bypass throttling with exact matching, but loose prefixes do not bypass', async () => {
    const ip = '198.51.100.3';
    
    // 1. Exact health endpoint with query params is exempt
    const healthWithQuery = createMockContext('GET', '/api/v1/health?check=db', ip, TestController.prototype.health);
    for (let i = 0; i < 10; i++) {
      expect(await guard.canActivate(healthWithQuery)).toBe(true);
    }

    // 2. Exact /health is exempt
    const plainHealth = createMockContext('GET', '/health', ip, TestController.prototype.health);
    for (let i = 0; i < 10; i++) {
      expect(await guard.canActivate(plainHealth)).toBe(true);
    }

    // 3. Loose prefix like /api/v1/healthcare must NOT bypass URL check
    const pseudoHealth = createMockContext('POST', '/api/v1/healthcare', ip, TestController.prototype.limited);
    await expect(guard.canActivate(pseudoHealth)).resolves.toBe(true);
    await expect(guard.canActivate(pseudoHealth)).resolves.toBe(true);
    // 3rd request must be blocked by rate limit (not bypassed!)
    await expect(guard.canActivate(pseudoHealth)).rejects.toThrow(HttpException);
  });

  it('4. Proxy IP handling isolates client buckets and respects Render reverse proxy topology', async () => {
    // Client A sends 2 requests to limited endpoint (exhausting quota of 2)
    const contextA = createMockContext('POST', '/test/limited', '198.51.100.10', TestController.prototype.limited);
    await expect(guard.canActivate(contextA)).resolves.toBe(true);
    await expect(guard.canActivate(contextA)).resolves.toBe(true);
    await expect(guard.canActivate(contextA)).rejects.toThrow(HttpException);

    // Client B from distinct client IP (198.51.100.11) is unaffected and succeeds
    const contextB = createMockContext('POST', '/test/limited', '198.51.100.11', TestController.prototype.limited);
    await expect(guard.canActivate(contextB)).resolves.toBe(true);
  });

  it('5. Sensitive route overrides enforce stricter limits without choking un-decorated routes', async () => {
    const ip = '198.51.100.20';
    
    // Sensitive limit is overridden to 1 request
    const sensitiveCtx = createMockContext('POST', '/test/sensitive', ip, TestController.prototype.sensitive);
    await expect(guard.canActivate(sensitiveCtx)).resolves.toBe(true);
    // Second request is rejected
    await expect(guard.canActivate(sensitiveCtx)).rejects.toThrow(HttpException);

    // General route on different endpoint for another client continues up to general limit (5)
    const generalCtx = createMockContext('GET', '/test/general', '198.51.100.21', TestController.prototype.general);
    for (let i = 0; i < 5; i++) {
      await expect(guard.canActivate(generalCtx)).resolves.toBe(true);
    }
  });
});
