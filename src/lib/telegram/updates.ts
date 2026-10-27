import 'server-only';
import { getDb } from '@/lib/cf';
import { sendApprovalPrompt, type ApprovalRow } from '@/lib/auth/approval';
import { callBot, sendMessage } from './bot';

/**
 * Bot webhook'iga kelgan update'lar. Hozircha faqat admin kirishi:
 * `/start <so'rov ID>` (saytdagi deep link) va tasdiq tugmalari. Boshqa xabarlarga
 * foydalanuvchining Telegram ID'si bilan javob beriladi (yangi admin qo'shish uchun).
 */

interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface Update {
  message?: { from?: TgUser; chat: { id: number; type: string }; text?: string };
  callback_query?: {
    id: string;
    from: TgUser;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
}

const NOT_ADMIN_TEXT = (id: string) =>
  [
    `Sizning Telegram ID'ingiz: ${id}`,
    '',
    "Siz admin sifatida ro'yxatda yo'qsiz. Admin bo'lish uchun shu raqamni mavjud adminga yuboring — u panelning «Adminlar» bo'limidan sizni qo'shadi.",
  ].join('\n');

export async function handleUpdate(update: Update): Promise<void> {
  if (update.callback_query) return handleCallback(update.callback_query);
  const msg = update.message;
  // Faqat shaxsiy chat: guruhlarda ID va tasdiq xabarlari ko'rinmasin.
  if (!msg?.from || msg.chat.type !== 'private') return;
  const text = msg.text || '';
  const payload = text.startsWith('/start') ? text.split(/\s+/)[1] || '' : '';
  return handleStart(msg.from, payload);
}

async function findAdmin(tgId: string) {
  return getDb()
    .prepare(`SELECT id, name FROM admins WHERE telegram_id = ?`)
    .bind(tgId)
    .first<{ id: string; name: string }>();
}

async function handleStart(from: TgUser, payload: string): Promise<void> {
  const tgId = String(from.id);
  const db = getDb();
  const admin = await findAdmin(tgId);

  if (!/^[\w-]{10,64}$/.test(payload)) {
    await sendMessage(
      tgId,
      admin
        ? `Siz admin sifatida ro'yxatdasiz (ID: ${tgId}).\nPanelga kirish: saytning /admin/login sahifasida «Telegram orqali kirish» tugmasini bosing.`
        : NOT_ADMIN_TEXT(tgId)
    );
    return;
  }

  const row = await db
    .prepare(`SELECT * FROM login_requests WHERE id = ? AND kind = 'login'`)
    .bind(payload)
    .first<ApprovalRow>();
  if (!row || row.status !== 'pending' || Date.parse(row.expiresAt) < Date.now()) {
    await sendMessage(
      tgId,
      "Kirish so'rovi topilmadi yoki muddati tugagan. Saytda «Telegram orqali kirish» tugmasini qaytadan bosing."
    );
    return;
  }

  if (!admin) {
    await db
      .prepare(
        `UPDATE login_requests SET status = 'not_admin'
          WHERE id = ? AND status = 'pending' AND admin_id IS NULL`
      )
      .bind(row.id)
      .run();
    await sendMessage(tgId, NOT_ADMIN_TEXT(tgId));
    return;
  }

  // So'rovni shu adminga bog'laymiz (birinchi kelgan admin; boshqasi uni egallay olmaydi).
  const bound = await db
    .prepare(
      `UPDATE login_requests SET admin_id = ?1
        WHERE id = ?2 AND status = 'pending' AND (admin_id IS NULL OR admin_id = ?1)`
    )
    .bind(admin.id, row.id)
    .run();
  if (!bound.meta.changes) {
    await sendMessage(tgId, "Bu kirish so'rovi boshqa akkauntga tegishli.");
    return;
  }
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ').slice(0, 100);
  await db
    .prepare(
      `UPDATE admins SET username = ?, name = CASE WHEN name = '' THEN ? ELSE name END WHERE id = ?`
    )
    .bind((from.username || '').slice(0, 64), fullName, admin.id)
    .run();
  await sendApprovalPrompt(tgId, row);
}

async function handleCallback(cq: NonNullable<Update['callback_query']>): Promise<void> {
  const answer = (text: string) =>
    callBot('answerCallbackQuery', { callback_query_id: cq.id, text }).catch(() => {});
  const editTo = (text: string) =>
    cq.message
      ? callBot('editMessageText', {
          chat_id: cq.message.chat.id,
          message_id: cq.message.message_id,
          text,
        }).catch(() => {})
      : Promise.resolve();

  const match = /^a:([\w-]{10,64}):(\d{2}|x)$/.exec(cq.data || '');
  if (!match) return void (await answer(''));
  const [, id, choice] = match;

  const db = getDb();
  const row = await db
    .prepare(
      `SELECT r.*, a.telegram_id AS telegramId FROM login_requests r
         JOIN admins a ON a.id = r.admin_id
        WHERE r.id = ?`
    )
    .bind(id)
    .first<ApprovalRow & { telegramId: string }>();

  if (!row || row.telegramId !== String(cq.from.id)) {
    await answer("So'rov topilmadi");
    await editTo("⌛ So'rov topilmadi yoki muddati tugagan.");
    return;
  }
  if (row.status !== 'pending' || Date.parse(row.expiresAt) < Date.now()) {
    await answer("So'rov eskirgan");
    await editTo("⌛ Bu so'rovning muddati tugagan yoki u allaqachon ko'rib chiqilgan.");
    return;
  }

  const approved = choice === row.code;
  const result = await db
    .prepare(
      `UPDATE login_requests SET status = ? WHERE id = ? AND status = 'pending' AND expiresAt > ?`
    )
    .bind(approved ? 'approved' : 'denied', row.id, new Date().toISOString())
    .run();
  if (!result.meta.changes) {
    await answer("So'rov allaqachon yakunlangan");
    return;
  }

  if (approved) {
    await answer('Tasdiqlandi');
    await editTo(
      row.kind === 'login'
        ? `✅ Kirish tasdiqlandi (${row.client}). Brauzerga qayting.`
        : '✅ Amal tasdiqlandi. Brauzerga qayting.'
    );
  } else if (choice === 'x') {
    await answer('Bekor qilindi');
    await editTo(
      `❌ So'rov bekor qilindi (${row.client}, IP ${row.ip}).\nAgar bu siz bo'lmasangiz, hech narsa qilish shart emas — kirish amalga oshmadi.`
    );
  } else {
    await answer("Noto'g'ri raqam");
    await editTo(
      "❌ Noto'g'ri raqam tanlandi — so'rov bekor qilindi. Saytda qaytadan urinib ko'ring."
    );
  }
}
