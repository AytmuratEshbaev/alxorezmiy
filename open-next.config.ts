import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Barcha sahifalar D1'dan har so'rovda o'qiydi (force-dynamic), shuning uchun
// ISR incremental cache kerak emas — default (keshsiz) konfiguratsiya yetarli.
export default defineCloudflareConfig({});
