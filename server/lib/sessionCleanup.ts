import { config } from "../config";

// Placeholder for session cleanup
// This will be implemented when Prisma/database is set up

interface SessionStore {
  deleteExpired(): Promise<number>;
}

let sessionStore: SessionStore | null = null;

export function setSessionStore(store: SessionStore): void {
  sessionStore = store;
}

export async function cleanupExpiredSessions(): Promise<number> {
  if (!sessionStore) {
    if (process.env.NODE_ENV !== "production") {
      console.log("⚠️  Session store not configured, skipping cleanup");
    }
    return 0;
  }

  try {
    const deleted = await sessionStore.deleteExpired();
    if (process.env.NODE_ENV !== "production") {
      console.log(`🧹 Cleaned up ${deleted} expired sessions`);
    }
    return deleted;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ Session cleanup failed:", error);
    }
    return 0;
  }
}

// Schedule daily cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startSessionCleanup(): void {
  // Run cleanup on startup
  cleanupExpiredSessions();

  // Run daily at midnight
  const msUntilMidnight = getMsUntilMidnight();
  
  setTimeout(() => {
    cleanupExpiredSessions();
    // Then run every 24 hours
    cleanupInterval = setInterval(cleanupExpiredSessions, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  if (process.env.NODE_ENV !== "production") {
    console.log(`⏰ Session cleanup scheduled (first run in ${Math.round(msUntilMidnight / 1000 / 60)}min)`);
  }
}

export function stopSessionCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// Example Prisma implementation (for when DB is set up):
/*
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

setSessionStore({
  async deleteExpired() {
    const result = await prisma.authSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  },
});
*/
