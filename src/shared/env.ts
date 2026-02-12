import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_SECRET: z.string().min(16),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  RAILWAY_API_TOKEN: z.string().optional(),
  RAILWAY_PROJECT_ID: z.string().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_SECRET: process.env.APP_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  RAILWAY_API_TOKEN: process.env.RAILWAY_API_TOKEN,
  RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID
});
