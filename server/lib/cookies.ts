import { Response } from "express";
import { config } from "../config";

export const SESSION_COOKIE_NAME = "session";

export interface SessionCookieOptions {
  maxAge?: number;
}

export function setSessionCookie(
  res: Response,
  sessionToken: string,
  options: SessionCookieOptions = {}
): void {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: options.maxAge ?? config.cookie.maxAge,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: "/",
  });
}

export function getSessionToken(cookies: Record<string, string>): string | undefined {
  return cookies[SESSION_COOKIE_NAME];
}
