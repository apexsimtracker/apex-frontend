import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId?: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();

  res.on("finish", () => {
    const responseTimeMs = Date.now() - start;
    const userId = req.userId ?? "anon";
    const { method, originalUrl } = req;
    const { statusCode } = res;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        method,
        url: originalUrl,
        statusCode,
        responseTimeMs,
        userId,
      })
    );
  });

  next();
}
