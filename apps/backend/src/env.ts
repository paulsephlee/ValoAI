import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  TEMP_DIR: z.string().default('/tmp/valoai'),
  MAX_VIDEO_SIZE_MB: z.coerce.number().default(500),
  MAX_VIDEO_DURATION_MINUTES: z.coerce.number().default(10),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
