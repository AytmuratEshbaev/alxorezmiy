#!/usr/bin/env node
/**
 * Birinchi (yoki qo'shimcha) admin foydalanuvchini D1'ga qo'shadi. Kirish Telegram orqali,
 * shuning uchun faqat Telegram ID kerak (parol yo'q).
 *
 *   npm run admin:create -- --telegram-id 123456789 --name "Ism Familiya" --remote
 *   npm run admin:create -- --telegram-id 123456789 --local
 *
 * Telegram ID'ni bilish: saytning botiga /start yozing — bot ID'ingizni yuboradi.
 */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const telegramId = (arg('telegram-id') || '').trim();
const name = (arg('name') || '').trim().slice(0, 100);
const isLocal = process.argv.includes('--local');
const isRemote = process.argv.includes('--remote');
// Production'ga tasodifan yozib yubormaslik uchun maqsad aniq ko'rsatilishi shart.
const target = isLocal && !isRemote ? '--local' : isRemote && !isLocal ? '--remote' : null;

if (!/^\d{1,20}$/.test(telegramId) || !target) {
  console.error(
    'Foydalanish: npm run admin:create -- --telegram-id <raqam> [--name "Ism"] (--local | --remote)'
  );
  process.exit(1);
}

const id = randomUUID().replace(/-/g, '');
const now = new Date().toISOString();

// Mavjud bo'lsa — faqat ism yangilanadi (bo'sh bo'lmasa).
const sql = `INSERT INTO admins (id, telegram_id, name, createdAt)
VALUES (${sqlStr(id)}, ${sqlStr(telegramId)}, ${sqlStr(name)}, ${sqlStr(now)})
ON CONFLICT(telegram_id) DO UPDATE SET
  name = CASE WHEN excluded.name != '' THEN excluded.name ELSE admins.name END;
`;

// SQL vaqtinchalik fayl orqali: Windows'da buyruq qatoridagi qo'shtirnoqlar buzilmasin.
const dir = mkdtempSync(join(tmpdir(), 'ax-admin-'));
const file = join(dir, 'admin.sql');
writeFileSync(file, sql);
try {
  // wrangler to'g'ridan-to'g'ri Node orqali, shell'siz: yo'lda bo'sh joy yoki maxsus belgilar
  // bo'lsa ham argumentlar buzilmaydi (Windows'da .cmd'ni shell'siz ishga tushirib bo'lmaydi).
  const wrangler = fileURLToPath(
    new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)
  );
  const res = spawnSync(
    process.execPath,
    [wrangler, 'd1', 'execute', 'DB', target, `--file=${file}`, '-y'],
    { stdio: 'inherit', shell: false }
  );
  if (res.error) {
    console.error(res.error.message);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status ?? 1);
  console.log(
    `\n✓ Admin tayyor: Telegram ID ${telegramId} (${target === '--local' ? 'lokal' : 'production'} D1)`
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
