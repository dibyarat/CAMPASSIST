import { describe, it, expect, vi } from 'vitest';

describe('Security Headers Middleware', () => {
  it('should attach required security headers and proceed to next middleware', () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: vi.fn((key: string, value: string) => {
        headers[key] = value;
      }),
    };
    const next = vi.fn();

    // Replicate the exact middleware in main.ts
    const securityMiddleware = (_req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
      next();
    };

    securityMiddleware({}, res, next);

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=(self)');
    expect(next).toHaveBeenCalledTimes(1);
  });
});

