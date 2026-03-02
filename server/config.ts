import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => {
        // Allow SQLite for dev, require proper URL for production
        if (process.env.NODE_ENV === "production") {
          return url.startsWith("postgresql://") || 
                 url.startsWith("postgres://") || 
                 url.startsWith("mysql://");
        }
        return true;
      },
      { message: "Production DATABASE_URL must be PostgreSQL or MySQL" }
    ),
  
  SESSION_TTL_HOURS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default("720"), // 30 days
  
  COOKIE_SECURE: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  
  CORS_ORIGIN: z
    .string()
    .optional(),
  
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default("8080"),
});

type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error("❌ Environment validation failed:");
    for (const error of result.error.errors) {
      console.error(`   - ${error.path.join(".")}: ${error.message}`);
    }
    process.exit(1);
  }
  
  return result.data;
}

const env = validateEnv();

// Derived configuration with secure defaults
export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
  
  port: env.PORT,
  
  database: {
    url: env.DATABASE_URL,
  },
  
  session: {
    ttlHours: env.SESSION_TTL_HOURS,
    ttlMs: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  },
  
  cookie: {
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
    sameSite: "lax" as const,
    httpOnly: true,
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  },
  
  cors: {
    origin: getCorsOrigin(env),
    credentials: true,
  },
} as const;

function getCorsOrigin(env: EnvConfig): string | string[] | boolean {
  // Explicit origin takes precedence
  if (env.CORS_ORIGIN) {
    // Support comma-separated origins
    const origins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
    return origins.length === 1 ? origins[0] : origins;
  }
  
  // Production requires explicit origin
  if (env.NODE_ENV === "production") {
    console.error("❌ CORS_ORIGIN is required in production");
    process.exit(1);
  }
  
  // Development: allow localhost
  return [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
  ];
}

// Log config on startup (non-sensitive values only)
export function logConfig(): void {
  console.log("🔧 Server configuration:");
  console.log(`   NODE_ENV: ${config.env}`);
  console.log(`   PORT: ${config.port}`);
  console.log(`   SESSION_TTL: ${config.session.ttlHours}h`);
  console.log(`   COOKIE_SECURE: ${config.cookie.secure}`);
  console.log(`   CORS_ORIGIN: ${JSON.stringify(config.cors.origin)}`);
  console.log(`   DATABASE: ${config.database.url.replace(/\/\/.*@/, "//***@")}`);
}

export type Config = typeof config;
