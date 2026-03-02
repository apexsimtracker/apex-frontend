import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = req.requestId ?? "unknown";
  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        level: "error",
        statusCode,
        message: err.message,
        stack: err.stack,
      })
    );
  } else {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        level: "warn",
        statusCode,
        message: err.message,
      })
    );
  }

  const clientMessage = isServerError
    ? "An unexpected error occurred. Please try again later."
    : err.message;

  res.status(statusCode).json({
    error: {
      message: clientMessage,
      requestId,
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  const requestId = req.requestId ?? "unknown";

  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      level: "warn",
      statusCode: 404,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    })
  );

  res.status(404).json({
    error: {
      message: "Not found",
      requestId,
    },
  });
}
