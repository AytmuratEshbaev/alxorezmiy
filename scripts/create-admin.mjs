#!/usr/bin/env node
/**
 * Birinchi (yoki qo'shimcha) admin foydalanuvchini D1'ga qo'shadi.
 *
 *   npm run admin:create -- --email admin@alxorezmiy.uz --name "Ism Familiya" --remote
 *   npm run admin:create -- --email admin@alxorezmiy.uz --local
 *
 * Parol so'raladi (ekranda ko'rinmaydi). Hash formati src/lib/auth/password.ts bilan bir xil:
 *   pbkdf2-sha256$100000$<salt b64>$<hash b64>
 */
import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const ITERATIONS = 100_000;
const MIN_LENGTH = 10;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.startsWith(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const email = (arg('email') || '').trim().toLowerCase();
const name = (arg('name') || '').trim();
const isLocal = process.argv.includes('--local');
const isRemote = process.argv.includes('--remote');
// Production'ga tasodifan yozib yubormaslik uchun maqsad aniq ko'rsatilishi shart.
const target = isLocal && !isRemote ? '--local' : isRemote && !isLocal ? '--remote' : null;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !target) {
  console.error(
    'Foydalanish: npm run admin:create -- --email <email> [--name "Ism"] (--local | --remote)'
  );
  process.exit(1);
}

// ADMIN_PASSWORD faqat CI/avtomatlashtirish uchun; qo'lda ishlatsangiz shell tarixidan o'chiring.
const password = process.env.ADMIN_PASSWORD || (await askHidden(`Parol (${email}): `));
if (password.length < MIN_LENGTH) {
  console.error(`Parol kamida ${MIN_LENGTH} belgidan iborat bo'lishi kerak.`);
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
  const again = await askHidden('Parolni takrorlang: ');
  if (again !== password) {
    console.error('Parollar mos kelmadi.');
    process.exit(1);
  }
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const passwordHash = `pbkdf2-sha256$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
const id = randomUUID().replace(/-/g, '');
const now = new Date().toISOString();

// Mavjud email bo'lsa — parol va ism yangilanadi (parolni tiklash uchun ham shu skript).
const sql = `INSERT INTO admins (id, email, name, password_hash, createdAt)
VALUES (${sqlStr(id)}, ${sqlStr(email)}, ${sqlStr(name)}, ${sqlStr(passwordHash)}, ${sqlStr(now)})
ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash,
  name = CASE WHEN excluded.name != '' THEN excluded.name ELSE admins.name END;
DELETE FROM sessions WHERE admin_id = (SELECT id FROM admins WHERE email = ${sqlStr(email)});
`;

// Parol hash'i buyruq qatorida ko'rinmasin — vaqtinchalik fayl orqali.
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
  console.log(`\n✓ Admin tayyor: ${email} (${target === '--local' ? 'lokal' : 'production'} D1)`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
