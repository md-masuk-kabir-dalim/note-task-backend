import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().default("8000"),
  CORS_ORIGINS: z.string().default("http://localhost:8011"),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  END_POINT_PREFIX: z.string(),

  JWT_SECRET: z.string().min(10),
  VALID_API_KEYS: z.string().min(10),
  EXPIRES_IN: z.string().default("1h"),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  OTP_EXPIRES_IN: z.string().default("10m"),
  OTP_RESEND_COOLDOWN_SECONDS: z.string().optional().default("60"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  EMAIL_VERIFICATION: z.string().min(10),
  PASSWORD_RESET: z.string().min(10),
  PASSWORD_SALT: z.string(),
  CSRF_SECRET: z.string(),
  EMAIL: z.string().email(),
  APP_PASS: z.string().min(8),
  SUPERADMIN_PASSWORD: z.string().min(8),
  ADMIN_EMAIL: z.string().email(),
});

export default envSchema;
export type EnvSchema = z.infer<typeof envSchema>;
