-- Admin kirishi email + parol (PBKDF2) o'rniga Telegram bot orqali tasdiqlash.
-- Eski admin/sessiya yozuvlari o'chadi: adminlarni `npm run admin:create -- --telegram-id ...`
-- bilan qayta qo'shing.
PRAGMA defer_foreign_keys = on;

DELETE FROM sessions;
DROP TABLE IF EXISTS login_failures;
DROP TABLE admins;

CREATE TABLE admins (
  id          TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL UNIQUE, -- Telegram foydalanuvchi ID (52 bitgacha son, matn sifatida)
  name        TEXT NOT NULL DEFAULT '',
  username    TEXT NOT NULL DEFAULT '', -- oxirgi tasdiqlashdagi @username (faqat ko'rsatish uchun)
  createdAt   TEXT NOT NULL,
  lastLoginAt TEXT NOT NULL DEFAULT ''
);

-- Oxirgi marta Telegram orqali tasdiqlangan vaqt (xavfli amallar uchun "yaqinda kirgan" tekshiruvi).
ALTER TABLE sessions ADD COLUMN verifiedAt TEXT NOT NULL DEFAULT '';

-- Telegram tasdiq so'rovlari (kirish va xavfli amallar oldidan qayta tasdiqlash).
-- Brauzer HttpOnly cookie'dagi sirni saqlaydi (bazada faqat hash) — deep link'ni ko'rgan
-- boshqa odam tasdiqlangan so'rovdan sessiya ola olmaydi.
CREATE TABLE login_requests (
  id          TEXT PRIMARY KEY, -- ochiq ID: t.me/<bot>?start=<id> va tugma callback'lari
  secret_hash TEXT NOT NULL UNIQUE, -- sha256(brauzer cookie'si), hex
  kind        TEXT NOT NULL, -- 'login' | 'reauth'
  code        TEXT NOT NULL, -- saytda ko'rsatiladigan raqam; botda shuni tanlash kerak
  admin_id    TEXT REFERENCES admins(id) ON DELETE CASCADE, -- bot orqali aniqlangan admin
  session_id  TEXT, -- reauth: qaysi sessiya tasdiqlanadi
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | approved | denied | not_admin
  ip          TEXT NOT NULL DEFAULT '',
  client      TEXT NOT NULL DEFAULT '', -- "Chrome · Windows" (botdagi xabar uchun)
  createdAt   TEXT NOT NULL,
  expiresAt   TEXT NOT NULL
);
CREATE INDEX idx_login_requests_expires ON login_requests (expiresAt);
