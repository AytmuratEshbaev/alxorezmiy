#!/usr/bin/env node
/**
 * Telegram bot webhook'ini saytga ulaydi (bir martalik; token yoki domen o'zgarsa qayta).
 *
 *   npm run bot:setup                         # token so'raladi, sayt: NEXT_PUBLIC_SITE_URL
 *   npm run bot:setup -- --site https://alxorezmiy.uz
 *   npm run bot:check                        # webhook holatini o'zgartirmasdan tekshirish
 *
 * Webhook secret_token bot token'dan hosil qilinadi (src/lib/telegram/bot.ts → webhookSecret),
 * shuning uchun Cloudflare'ga faqat TELEGRAM_BOT_TOKEN secret'i qo'shiladi.
 */
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

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
      resolve(answer.trim());
    });
  });
}

function siteFromWrangler() {
  try {
    const text = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    return /"NEXT_PUBLIC_SITE_URL"\s*:\s*"([^"]+)"/.exec(text)?.[1];
  } catch {
    return undefined;
  }
}

const site = (arg('site') || siteFromWrangler() || '').replace(/\/+$/, '');
if (!/^https:\/\/[^/]+$/.test(site)) {
  console.error('Sayt manzili topilmadi: --site https://domen.uz');
  process.exit(1);
}

// TELEGRAM_BOT_TOKEN env'dan ham olinadi; qo'lda ishlatsangiz shell tarixidan o'chiring.
const token = process.env.TELEGRAM_BOT_TOKEN || (await askHidden('Bot token (BotFather): '));
if (!/^\d+:[\w-]{30,}$/.test(token)) {
  console.error("Token formati noto'g'ri (123456789:AA...).");
  process.exit(1);
}

async function call(method, params = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

const secret = createHmac('sha256', token).update('alxorezmiy-webhook').digest('hex');
const url = `${site}/api/telegram/webhook`;

try {
  const me = await call('getMe');
  const checkOnly = process.argv.includes('--check');
  if (!checkOnly) {
    await call('setWebhook', {
      url,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
    });
    await call('setMyCommands', {
      commands: [{ command: 'start', description: 'Telegram ID va kirish haqida' }],
    });
  }
  const info = await call('getWebhookInfo');
  if (info.url !== url) {
    throw new Error(`Webhook mos emas: ${info.url || "o'rnatilmagan"}. Kutilgan: ${url}`);
  }
  console.log(`✓ @${me.username} → ${info.url}`);
  console.log(`  Navbatdagi update'lar: ${info.pending_update_count ?? 0}`);
  if (info.last_error_message) console.log(`  Oxirgi xato: ${info.last_error_message}`);
  console.log(
    "\nCloudflare'da secret ham bo'lishi shart: npx wrangler secret put TELEGRAM_BOT_TOKEN"
  );
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
