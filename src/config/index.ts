import dotenv from "dotenv";
import path from "path";
import envSchema from "./envSchema";

dotenv.config({ path: path.join(process.cwd(), ".env") });

let env;
try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error("❌ Invalid environment variables!");
  if (err instanceof Error) console.error(err.message);
  else console.error(err);
  process.exit(1);
}

export default {
  env: env.NODE_ENV,
  port: Number(env.PORT) || 8000,
  cors_origin: env.CORS_ORIGINS.split(","),
  database_url: env.DATABASE_URL,
  url: {
    frontend_url: env.FRONTEND_URL,
    backend_url: env.BACKEND_URL,
    end_point_prefix: env.END_POINT_PREFIX,
  },

  jwt: {
    access_secret: env.JWT_SECRET!,
    api_keys: env.VALID_API_KEYS!,
    refresh_secret: env.REFRESH_TOKEN_SECRET!,
    access_expires_in: env.EXPIRES_IN,
    refresh_expires_in: env.REFRESH_TOKEN_EXPIRES_IN,
    otp_expires_in: env.OTP_EXPIRES_IN || "10m",
    otp_resend_cooldown_seconds:
      Number(env.OTP_RESEND_COOLDOWN_SECONDS) || 60,
    CSRF_SECRET: env.CSRF_SECRET,
    email_verification_secret: env.EMAIL_VERIFICATION!,
    password_reset_secret: env.PASSWORD_RESET!,
  },
  emailSender: {
    email: env.EMAIL,
    app_pass: env.APP_PASS,
  },

  password: {
    password_salt: env.PASSWORD_SALT,
    superadmin_password: env.SUPERADMIN_PASSWORD,
    admin_email: env.ADMIN_EMAIL,
  },
};
