import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // The API uses DATABASE_URL (Supabase transaction pooler), while Prisma
    // migrations should use the session pooler when DIRECT_URL is available.
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
