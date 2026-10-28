-- O'quvchilar sertifikatlari (Yutuqlarimiz sahifasidagi "Sertifikatlar" bo'limi).
CREATE TABLE certificates (
  id        TEXT PRIMARY KEY,
  student   TEXT NOT NULL DEFAULT '',
  type      TEXT NOT NULL DEFAULT 'milliy', -- milliy | ielts | sat | cefr
  subject   TEXT NOT NULL DEFAULT '',       -- kalit: english, math, uzbek, history, biology, chemistry, russian, karakalpak, physics ('' = ko'rsatilmaydi)
  score     TEXT NOT NULL DEFAULT '',       -- masalan: 'A+', 'B2 (56)', '7.5', '1510'
  year      INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX idx_certificates_type_year ON certificates (type, year DESC);
