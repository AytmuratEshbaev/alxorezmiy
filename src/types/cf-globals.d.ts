// `wrangler types --include-runtime=false` chiqargan cloudflare-env.d.ts global nomlarni
// (D1Database, R2Bucket, ...) ishlatadi. Workers runtime turlarini butunlay global qilish
// DOM lib bilan to'qnashadi, shuning uchun faqat kerakli turlarni global alias qilamiz.
import type * as CF from '@cloudflare/workers-types';

declare global {
  type D1Database = CF.D1Database;
  type R2Bucket = CF.R2Bucket;
  type RateLimit = CF.RateLimit;
  type Fetcher = CF.Fetcher;
}

export {};
