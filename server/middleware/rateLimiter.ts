import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipInDev?: boolean;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.resetAt <= now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  check(key: string, windowMs: number, maxRequests: number): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSec: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: maxRequests - 1, resetAt, retryAfterSec: 0 };
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfterSec };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetAt: entry.resetAt,
      retryAfterSec: 0,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const globalLimiter = new InMemoryRateLimiter();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator,
    skipInDev = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (skipInDev && process.env.NODE_ENV === "development") {
      return next();
    }

    const key = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const result = globalLimiter.check(key, windowMs, maxRequests);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfterSec);
      const requestId = req.requestId ?? "unknown";

      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          requestId,
          level: "warn",
          event: "rate_limit_exceeded",
          key,
          path: req.path,
        })
      );

      return res.status(429).json({
        error: {
          message: "Too many requests. Try again later.",
          requestId,
        },
      });
    }

    next();
  };
}

// Pre-configured limiters for common use cases

// Auth: strict limits
export const loginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 10,
  keyGenerator: (req) => `login:${getClientIp(req)}`,
});

export const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: (req) => `signup:${getClientIp(req)}`,
});

export const changePasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyGenerator: (req) => {
    const userId = req.userId;
    return userId ? `changepw:user:${userId}` : `changepw:ip:${getClientIp(req)}`;
  },
});

export const deleteAccountLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: (req) => {
    const userId = req.userId;
    return userId ? `deleteacct:user:${userId}` : `deleteacct:ip:${getClientIp(req)}`;
  },
});

// Community: spam control
export const createDiscussionLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyGenerator: (req) => {
    const userId = req.userId;
    return userId ? `discussion:user:${userId}` : `discussion:ip:${getClientIp(req)}`;
  },
});

export const createCommentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 60,
  keyGenerator: (req) => {
    const userId = req.userId;
    return userId ? `comment:user:${userId}` : `comment:ip:${getClientIp(req)}`;
  },
});

// Telemetry uploads
export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 120,
  keyGenerator: (req) => {
    const userId = req.userId;
    return userId ? `upload:user:${userId}` : `upload:ip:${getClientIp(req)}`;
  },
});

// Export for testing
export { globalLimiter, getClientIp };
