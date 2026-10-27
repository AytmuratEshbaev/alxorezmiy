'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { toast } from '@/components/admin/Toast';
import { LANGS, type Lang } from '@/components/admin/lang';
import { LangPanel, LangTabs } from '@/components/admin/LangTabs';
import { useUnsavedGuard } from '@/components/admin/useUnsavedGuard';
import { validateFields } from '@/components/admin/validate';
import { apiFetch, isSessionError } from '@/lib/admin-api';

type TextKey =
  | `fullName_${Lang}`
  | `shortName_${Lang}`
  | 'address'
  | 'phone'
  | 'email'
  | 'hours'
  | 'telegram'
  | 'instagram'
  | 'facebook'
  | 'youtube';

const TEXT_KEYS: TextKey[] = [
  ...LANGS.flatMap((l): TextKey[] => [`fullName_${l}`, `shortName_${l}`]),
  'address',
  'phone',
  'email',
  'hours',
  'telegram',
  'instagram',
  'facebook',
  'youtube',
];

const STAT_KEYS = ['students_count', 'teachers_count', 'experience_years', 'olympiad_winners'] as const;

type StatKey = (typeof STAT_KEYS)[number];
type FieldKey = TextKey | StatKey;
/** Barcha maydonlar string holatda (raqamli maydonni tozalaganda qiymat "sakrab" qaytmasin). */
type FormState = Record<FieldKey, string>;

const ALL_KEYS: FieldKey[] = [...TEXT_KEYS, ...STAT_KEYS];
const isStat = (k: FieldKey): k is StatKey => (STAT_KEYS as readonly string[]).includes(k);
const MAX_STAT = 1_000_000;

function toForm(d: Record<string, unknown>): FormState {
  const out = {} as FormState;
  for (const k of ALL_KEYS) {
    const v = d[k];
    out[k] = v === null || v === undefined ? '' : String(v);
  }
  return out;
}

const SOCIALS: { key: FieldKey; label: string; placeholder: string }[] = [
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/kanal_nomi' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/sahifa' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/sahifa' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@kanal' },
];

const STATS: { key: StatKey; label: string }[] = [
  { key: 'students_count', label: "O'quvchilar" },
  { key: 'teachers_count', label: "O'qituvchilar" },
  { key: 'experience_years', label: 'Tajriba (yil)' },
  { key: 'olympiad_winners', label: "Olimpiada g'oliblari" },
];

export default function SettingsAdminPage() {
  const [snapshot, setSnapshot] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('uz');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await apiFetch<Record<string, unknown>>('/api/admin/settings');
      const f = toForm(d);
      setSnapshot(f);
      setForm(f);
    } catch (err) {
      console.error('Load settings error:', err);
      setLoadError((err as Error).message || "Sozlamalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changedKeys =
    form && snapshot ? ALL_KEYS.filter((k) => form[k].trim() !== snapshot[k].trim()) : [];
  const dirty = changedKeys.length > 0;
  useUnsavedGuard(dirty);

  const set = (key: FieldKey, value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !snapshot) return;
    if (!dirty) {
      toast.info("O'zgarish yo'q");
      return;
    }
    const valid = validateFields(
      STATS.map(({ key, label }) => {
        const raw = form[key].trim();
        const n = Number(raw);
        return {
          valid: raw === '' || (Number.isInteger(n) && n >= 0 && n <= MAX_STAT),
          fieldId: `settings-${key}`,
          message: `${label}: 0 dan ${MAX_STAT.toLocaleString('uz-UZ')} gacha butun son kiriting`,
        };
      })
    );
    if (!valid) return;

    // Faqat o'zgargan maydonlar yuboriladi — boshqa admin bir vaqtda o'zgartirgan maydonlar bosilib ketmaydi.
    const payload: Record<string, string | number> = {};
    for (const k of changedKeys) {
      const v = form[k].trim();
      payload[k] = isStat(k) ? (v === '' ? '' : Number(v)) : v;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch<{ ok: boolean; settings?: Record<string, unknown> }>(
        '/api/admin/settings',
        { method: 'PUT', body: JSON.stringify(payload) }
      );
      const next = res.settings ? toForm(res.settings) : form;
      setSnapshot(next);
      setForm(next);
      setMsg({ text: 'Sozlamalar saqlandi', ok: true });
      toast.success('Sozlamalar saqlandi');
    } catch (err) {
      if (!isSessionError(err)) {
        const text = (err as Error).message;
        setMsg({ text, ok: false });
        toast.error('Xatolik: ' + text);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadError || !form) {
    return (
      <>
        <AdminHeader title="Sozlamalar" />
        <div className="content-area">
          {loading ? (
            <div className="list-state" role="status">
              Yuklanmoqda...
            </div>
          ) : (
            <div className="list-state list-state-error" role="alert">
              <p>Sozlamalarni yuklab bo&apos;lmadi: {loadError}</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => void load()}>
                Qayta yuklash
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  const textInput = (key: FieldKey, label: string, opts: { type?: string; placeholder?: string; inputMode?: 'url' | 'tel' | 'email' } = {}) => (
    <div className="form-group">
      <label htmlFor={`settings-${key}`}>{label}</label>
      <input
        id={`settings-${key}`}
        type={opts.type ?? 'text'}
        inputMode={opts.inputMode}
        placeholder={opts.placeholder}
        className="form-control"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <>
      <AdminHeader title="Sozlamalar" />
      <div className="content-area">
        <form onSubmit={handleSubmit}>
          <div className="admin-card">
            <div className="card-header">
              <h2 className="card-title">Maktab nomi</h2>
            </div>
            <LangTabs idPrefix="settings" active={activeLang} onChange={setActiveLang} />
            {LANGS.map((l) => (
              <LangPanel key={l} idPrefix="settings" lang={l} active={activeLang}>
                <div className="form-grid form-grid-2">
                  {textInput(`fullName_${l}`, `To'liq nom (${l.toUpperCase()})`)}
                  {textInput(`shortName_${l}`, `Qisqa nom (${l.toUpperCase()})`)}
                </div>
              </LangPanel>
            ))}
          </div>

          <div className="admin-card">
            <div className="card-header">
              <h2 className="card-title">Kontakt</h2>
            </div>
            {textInput('address', 'Manzil')}
            <div className="form-grid form-grid-2">
              {textInput('phone', 'Telefon', { type: 'tel', placeholder: '+998 61 000 00 00' })}
              {textInput('email', 'Email', { type: 'email', placeholder: 'info@alxorezmiy.uz' })}
            </div>
            {textInput('hours', 'Ish vaqti')}
          </div>

          <div className="admin-card">
            <div className="card-header">
              <h2 className="card-title">Ijtimoiy tarmoqlar</h2>
            </div>
            <p className="form-hint form-hint-block">
              To&apos;liq havola kiriting. &quot;https://&quot; yozilmasa, avtomatik qo&apos;shiladi.
            </p>
            <div className="form-grid form-grid-2">
              {SOCIALS.map((s) => (
                <div key={s.key}>
                  {textInput(s.key, s.label, { inputMode: 'url', placeholder: s.placeholder })}
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="card-header">
              <h2 className="card-title">Statistika</h2>
            </div>
            <p className="form-hint form-hint-block">
              Bo&apos;sh qoldirilgan ko&apos;rsatkich saytda ko&apos;rsatilmaydi.
            </p>
            <div className="form-grid form-grid-4">
              {STATS.map((s) => (
                <div className="form-group" key={s.key}>
                  <label htmlFor={`settings-${s.key}`}>{s.label}</label>
                  <input
                    id={`settings-${s.key}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_STAT}
                    className="form-control"
                    value={form[s.key]}
                    onChange={(e) => set(s.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            {dirty && !saving && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setForm(snapshot);
                  setMsg(null);
                }}
              >
                O&apos;zgarishlarni bekor qilish
              </button>
            )}
            {msg && (
              <span className={msg.ok ? 'text-success' : 'text-danger'} role={msg.ok ? 'status' : 'alert'}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
