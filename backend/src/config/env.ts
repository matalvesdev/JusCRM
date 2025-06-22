import { config } from "dotenv";
import { z } from "zod";

// Carregar variáveis de ambiente do arquivo .env
config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3333),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORGANIZATION: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  console.log("Current process.env values:");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  console.log(
    "JWT_SECRET:",
    process.env.JWT_SECRET
      ? `SET (length: ${process.env.JWT_SECRET.length})`
      : "NOT SET"
  );
  console.log(
    "JWT_REFRESH_SECRET:",
    process.env.JWT_REFRESH_SECRET
      ? `SET (length: ${process.env.JWT_REFRESH_SECRET.length})`
      : "NOT SET"
  );
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
