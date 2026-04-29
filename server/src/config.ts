import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '.env') });

const booleanString = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  MUSIC_ROOT: z.string().default('/music'),
  DB_PATH: z.string().default('./data/streamsound.db'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_ACCESS_EXPIRES: z.string().default('1h'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  SCAN_CRON: z.string().default('0 * * * *'),
  SCAN_ON_START: booleanString.default(true),
  REQUIRE_APPROVAL: booleanString.default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
