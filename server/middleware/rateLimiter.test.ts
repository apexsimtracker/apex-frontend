import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { Express } from "express";
import { createRateLimiter } from "./rateLimiter";

function createTestApp(limiter: ReturnType<typeof createRateLimiter>): Express {
  const app = express();
  
  // Mock requestId middleware
  app.use((req, _res, next) => {
    req.requestId = "test-request-id";
    next();
  });

  app.post("/test", limiter, (_req, res) => {
    res.json({ success: true });
  });

  return app;
}

async function makeRequest(app: Express, ip = "127.0.0.1") {
  const req = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
  };

  return new Promise<{ status: number; body: unknown; headers: Record<string, string> }>((resolve) => {
    const mockReq = {
      method: "POST",
      path: "/test",
      originalUrl: "/test",
      headers: { "x-forwarded-for": ip },
      ip,
      socket: { remoteAddress: ip },
      requestId: "test-request-id",
    } as unknown as express.Request;

    const responseHeaders: Record<string, string> = {};
    let statusCode = 200;
    let responseBody: unknown;

    const mockRes = {
      setHeader: (name: string, value: string | number) => {
        responseHeaders[name.toLowerCase()] = String(value);
        return mockRes;
      },
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (body: unknown) => {
        responseBody = body;
        resolve({ status: statusCode, body: responseBody, headers: responseHeaders });
        return mockRes;
      },
    } as unknown as express.Response;

    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 3,
      keyGenerator: () => `test:${ip}`,
    });

    limiter(mockReq, mockRes, () => {
      mockRes.json({ success: true });
    });
  });
}

describe("rateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests within the limit", async () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 3,
      keyGenerator: () => "test-key-1",
    });

    const mockReq = {
      path: "/test",
      originalUrl: "/test",
      headers: {},
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      requestId: "test-id",
    } as unknown as express.Request;

    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};

    const mockRes = {
      setHeader: (name: string, value: string | number) => {
        responseHeaders[name.toLowerCase()] = String(value);
        return mockRes;
      },
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: () => mockRes,
    } as unknown as express.Response;

    const next = vi.fn();

    // First request - should pass
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(responseHeaders["x-ratelimit-remaining"]).toBe("2");

    // Second request - should pass
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(responseHeaders["x-ratelimit-remaining"]).toBe("1");

    // Third request - should pass
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(3);
    expect(responseHeaders["x-ratelimit-remaining"]).toBe("0");
  });

  it("returns 429 when limit exceeded", async () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 2,
      keyGenerator: () => "test-key-2",
    });

    const mockReq = {
      path: "/test",
      originalUrl: "/test",
      headers: {},
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      requestId: "test-id",
    } as unknown as express.Request;

    let statusCode = 200;
    let responseBody: unknown;
    const responseHeaders: Record<string, string> = {};

    const mockRes = {
      setHeader: (name: string, value: string | number) => {
        responseHeaders[name.toLowerCase()] = String(value);
        return mockRes;
      },
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: (body: unknown) => {
        responseBody = body;
        return mockRes;
      },
    } as unknown as express.Response;

    const next = vi.fn();

    // First two requests pass
    limiter(mockReq, mockRes, next);
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(2);

    // Third request should be blocked
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(2); // Still 2, not called again
    expect(statusCode).toBe(429);
    expect(responseBody).toEqual({
      error: {
        message: "Too many requests. Try again later.",
        requestId: "test-id",
      },
    });
    expect(responseHeaders["retry-after"]).toBeDefined();
  });

  it("resets after window expires", async () => {
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      keyGenerator: () => "test-key-3",
    });

    const mockReq = {
      path: "/test",
      originalUrl: "/test",
      headers: {},
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
      requestId: "test-id",
    } as unknown as express.Request;

    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};

    const mockRes = {
      setHeader: (name: string, value: string | number) => {
        responseHeaders[name.toLowerCase()] = String(value);
        return mockRes;
      },
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: () => mockRes,
    } as unknown as express.Response;

    const next = vi.fn();

    // First request passes
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second request blocked
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusCode).toBe(429);

    // Advance time past the window
    vi.advanceTimersByTime(61000);

    // Reset status for next check
    statusCode = 200;

    // Third request should pass (window reset)
    limiter(mockReq, mockRes, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(statusCode).toBe(200);
  });

  it("tracks different keys independently", async () => {
    let currentIp = "192.168.1.1";
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      keyGenerator: () => `test:${currentIp}`,
    });

    const createMockReq = (ip: string) => ({
      path: "/test",
      originalUrl: "/test",
      headers: { "x-forwarded-for": ip },
      ip,
      socket: { remoteAddress: ip },
      requestId: "test-id",
    }) as unknown as express.Request;

    let statusCode = 200;

    const mockRes = {
      setHeader: () => mockRes,
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: () => mockRes,
    } as unknown as express.Response;

    const next = vi.fn();

    // First IP - request passes
    currentIp = "192.168.1.1";
    limiter(createMockReq(currentIp), mockRes, next);
    expect(next).toHaveBeenCalledTimes(1);

    // First IP - second request blocked
    limiter(createMockReq(currentIp), mockRes, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusCode).toBe(429);

    // Second IP - request passes (different key)
    statusCode = 200;
    currentIp = "192.168.1.2";
    limiter(createMockReq(currentIp), mockRes, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
