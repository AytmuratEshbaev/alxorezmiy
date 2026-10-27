-- Al-Xorazmiy maktabi — boshlang'ich sxema (Firestore collection'lari o'rniga).
-- Ustun nomlari frontend'dagi maydon nomlari bilan bir xil (camelCase ham), shuning
-- uchun API qatlami qatorlarni hech qanday mapping'siz qaytaradi.
-- Vaqt ustunlari ISO-8601 matn (2026-10-26T09:15:00.000Z) — leksik tartib = xronologik tartib.

CREATE TABLE news (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL DEFAULT 'announcements',
  status      TEXT NOT NULL DEFAULT 'draft',
  image       TEXT NOT NULL DEFAULT '',
  imageId     TEXT NOT NULL DEFAULT '',
  title_uz    TEXT NOT NULL DEFAULT '',
  title_ru    TEXT NOT NULL DEFAULT '',
  title_kk    TEXT NOT NULL DEFAULT '',
  title_en    TEXT NOT NULL DEFAULT '',
  content_uz  TEXT NOT NULL DEFAULT '',
  content_ru  TEXT NOT NULL DEFAULT '',
  content_kk  TEXT NOT NULL DEFAULT '',
  content_en  TEXT NOT NULL DEFAULT '',
  publishedAt TEXT NOT NULL DEFAULT '', -- nashr sanasi; status 'published' bo'lganda server to'ldiradi
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
CREATE INDEX idx_news_status_published ON news (status, publishedAt DESC);

CREATE TABLE teachers (
  id           TEXT PRIMARY KEY,
  name_uz      TEXT NOT NULL DEFAULT '',
  name_ru      TEXT NOT NULL DEFAULT '',
  name_kk      TEXT NOT NULL DEFAULT '',
  name_en      TEXT NOT NULL DEFAULT '',
  subject_uz   TEXT NOT NULL DEFAULT '',
  subject_ru   TEXT NOT NULL DEFAULT '',
  subject_kk   TEXT NOT NULL DEFAULT '',
  subject_en   TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT '',
  experience   INTEGER NOT NULL DEFAULT 0,
  photo        TEXT NOT NULL DEFAULT '',
  photoId      TEXT NOT NULL DEFAULT '',
  achievements TEXT NOT NULL DEFAULT '[]', -- JSON: [{ type, title, year }]
  "order"      INTEGER NOT NULL DEFAULT 0,
  createdAt    TEXT NOT NULL,
  updatedAt    TEXT NOT NULL
);

CREATE INDEX idx_teachers_order ON teachers ("order", name_uz);

CREATE TABLE olympiad (
  id            TEXT PRIMARY KEY,
  student       TEXT NOT NULL DEFAULT '',
  subject       TEXT NOT NULL DEFAULT '',
  level         TEXT NOT NULL DEFAULT 'respublika',
  place         INTEGER NOT NULL DEFAULT 1,
  olympiad_name TEXT NOT NULL DEFAULT '',
  year          INTEGER NOT NULL DEFAULT 0,
  createdAt     TEXT NOT NULL,
  updatedAt     TEXT NOT NULL
);

CREATE INDEX idx_olympiad_year_place ON olympiad (year DESC, place ASC);

CREATE TABLE faq (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL DEFAULT 'general',
  "order"     INTEGER NOT NULL DEFAULT 0,
  question_uz TEXT NOT NULL DEFAULT '',
  question_ru TEXT NOT NULL DEFAULT '',
  question_kk TEXT NOT NULL DEFAULT '',
  question_en TEXT NOT NULL DEFAULT '',
  answer_uz   TEXT NOT NULL DEFAULT '',
  answer_ru   TEXT NOT NULL DEFAULT '',
  answer_kk   TEXT NOT NULL DEFAULT '',
  answer_en   TEXT NOT NULL DEFAULT '',
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);

CREATE INDEX idx_faq_order ON faq ("order", createdAt);

CREATE TABLE gallery (
  id         TEXT PRIMARY KEY,
  url        TEXT NOT NULL,
  fileId     TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'building',
  caption_uz TEXT NOT NULL DEFAULT '',
  caption_ru TEXT NOT NULL DEFAULT '',
  caption_kk TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  createdAt  TEXT NOT NULL,
  updatedAt  TEXT NOT NULL
);

CREATE INDEX idx_gallery_created ON gallery (createdAt DESC);

CREATE TABLE messages (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL,
  subject   TEXT NOT NULL,
  message   TEXT NOT NULL,
  read      INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX idx_messages_created ON messages (createdAt DESC);

CREATE TABLE applications (
  id          TEXT PRIMARY KEY,
  studentName TEXT NOT NULL,
  phone       TEXT NOT NULL,
  grade       TEXT NOT NULL,
  message     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'new',
  read        INTEGER NOT NULL DEFAULT 0,
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
CREATE INDEX idx_applications_created ON applications (createdAt DESC);

-- Sayt sozlamalari: bitta 'main' qatori, maydonlar JSON ichida (Firestore settings/main kabi).
CREATE TABLE settings (
  id        TEXT PRIMARY KEY,
  data      TEXT NOT NULL DEFAULT '{}',
  updatedAt TEXT NOT NULL
);
INSERT INTO settings (id, data, updatedAt) VALUES ('main', '{}', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

-- Admin panel foydalanuvchilari (Firebase Auth o'rniga). 0002'da Telegram login uchun almashtiriladi.
CREATE TABLE admins (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL, -- pbkdf2-sha256$<iter>$<salt b64>$<hash b64>
  createdAt     TEXT NOT NULL
);

-- Sessiyalar: cookie'da tasodifiy token, bazada faqat uning SHA-256 hash'i saqlanadi.
CREATE TABLE sessions (
  id        TEXT PRIMARY KEY, -- sha256(token), hex
  admin_id  TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expiresAt TEXT NOT NULL, -- sliding (faollik bilan uzayadi)
  absoluteExpiresAt TEXT NOT NULL, -- qat'iy chegara: kirishdan 30 kun
  createdAt TEXT NOT NULL
);
CREATE INDEX idx_sessions_admin ON sessions (admin_id);
CREATE INDEX idx_sessions_expires ON sessions (expiresAt);

-- Login brute-force himoyasi (0002'da olib tashlanadi).
CREATE TABLE login_failures (
  email       TEXT PRIMARY KEY COLLATE NOCASE,
  count       INTEGER NOT NULL DEFAULT 0,
  windowStart TEXT NOT NULL,
  lockedUntil TEXT NOT NULL DEFAULT ''
);

-- Edge kesh versiyasi: ommaviy kontent o'zgarganda +1 bo'ladi, Worker kesh kaliti shunga bog'liq
-- (worker.ts). Shu tufayli admin o'zgarishlari keshdan qat'i nazar darhol ko'rinadi.
CREATE TABLE cache_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  v  INTEGER NOT NULL
);
INSERT INTO cache_version (id, v) VALUES (1, 0);
