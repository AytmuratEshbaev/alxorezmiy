'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type FieldErrors = Partial<Record<'studentName' | 'phone' | 'grade', string>>;

const errorTextStyle: React.CSSProperties = {
  margin: 'var(--s-1) 0 0',
  color: 'var(--danger)',
  fontSize: '0.8125rem',
};

const GRADES = ['5', '6', '7', '8', '9', '10', '11'];

export default function ApplicationForm() {
  const t = useTranslations('admission_form');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ studentName: '', phone: '', grade: '', message: '' });
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.studentName.trim()) next.studentName = t('error_student_name');
    if (!form.phone.trim()) next.phone = t('error_phone');
    else if (!/^[+\d][\d\s()-]{6,19}$/.test(form.phone.trim()))
      next.phone = t('error_phone_invalid');
    if (!form.grade.trim()) next.grade = t('error_grade');
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const firstKey = (['studentName', 'phone', 'grade'] as const).find((k) => found[k]);
      if (firstKey) {
        const map = {
          studentName: 'applyStudentName',
          phone: 'applyPhone',
          grade: 'applyGrade',
        } as const;
        document.getElementById(map[firstKey])?.focus();
      }
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      setForm({ studentName: '', phone: '', grade: '', message: '' });
    } catch (err) {
      console.error('Apply error:', err);
      setStatus('error');
    }
  }

  const sending = status === 'sending';
  return (
    <form onSubmit={onSubmit} aria-busy={sending} noValidate>
      <fieldset disabled={sending} style={{ border: 0, padding: 0, margin: 0 }}>
        {/* Honeypot */}
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="applyWebsite">Website</label>
          <input
            type="text"
            id="applyWebsite"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="applyStudentName">{t('student_name')}</label>
          <input
            type="text"
            id="applyStudentName"
            className="form-control"
            placeholder={t('student_name')}
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
            autoComplete="name"
            required
            aria-invalid={errors.studentName ? true : undefined}
            aria-describedby={errors.studentName ? 'applyStudentName-error' : undefined}
          />
          {errors.studentName && (
            <p id="applyStudentName-error" role="alert" style={errorTextStyle}>
              {errors.studentName}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="applyPhone">{t('phone')}</label>
          <input
            type="tel"
            id="applyPhone"
            className="form-control"
            placeholder="+998 90 123 45 67"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            autoComplete="tel"
            required
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'applyPhone-error' : undefined}
          />
          {errors.phone && (
            <p id="applyPhone-error" role="alert" style={errorTextStyle}>
              {errors.phone}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="applyGrade">{t('grade')}</label>
          <select
            id="applyGrade"
            className="form-control"
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            required
            aria-invalid={errors.grade ? true : undefined}
            aria-describedby={errors.grade ? 'applyGrade-error' : undefined}
          >
            <option value="">{t('grade_placeholder')}</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {t('grade_option', { grade: g })}
              </option>
            ))}
          </select>
          {errors.grade && (
            <p id="applyGrade-error" role="alert" style={errorTextStyle}>
              {errors.grade}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="applyMessage">{t('message')}</label>
          <textarea
            id="applyMessage"
            className="form-control"
            placeholder={t('message')}
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={sending}>
          <span>{sending ? t('sending') : t('submit')}</span>
          {sending ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="apply-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </fieldset>

      <div role="status" aria-live="polite" style={{ minHeight: 'var(--s-6)' }}>
        {status === 'success' && (
          <p
            style={{
              padding: 'var(--s-3) var(--s-4)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: 'var(--r-md)',
              borderLeft: '3px solid var(--success)',
              margin: 'var(--s-4) 0 0',
            }}
          >
            {t('success')}
          </p>
        )}
        {status === 'error' && (
          <p
            style={{
              padding: 'var(--s-3) var(--s-4)',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: 'var(--r-md)',
              borderLeft: '3px solid var(--danger)',
              margin: 'var(--s-4) 0 0',
            }}
          >
            {t('error')}
          </p>
        )}
      </div>

      <style jsx>{`
        .apply-spin {
          animation: apply-spin 1s linear infinite;
        }
        @keyframes apply-spin {
          from {
            transform: rotate(0);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .apply-spin {
            animation: none;
          }
        }
      `}</style>
    </form>
  );
}
