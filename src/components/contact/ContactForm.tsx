'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ContactForm() {
  const t = useTranslations('contact_page');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Send error:', err);
      setStatus('error');
    }
  }

  const sending = status === 'sending';
  return (
    <form onSubmit={onSubmit} aria-busy={sending}>
      <fieldset disabled={sending} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="form-group">
          <label htmlFor="contactName">{t('form_name')}</label>
          <input
            type="text"
            id="contactName"
            className="form-control"
            placeholder={t('form_name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactEmail">{t('form_email')}</label>
          <input
            type="email"
            id="contactEmail"
            className="form-control"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactSubject">{t('form_subject')}</label>
          <input
            type="text"
            id="contactSubject"
            className="form-control"
            placeholder={t('form_subject')}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactMessage">{t('form_message')}</label>
          <textarea
            id="contactMessage"
            className="form-control"
            placeholder={t('form_message')}
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={sending}>
          <span>{sending ? t('form_sending') : t('form_send')}</span>
          {sending ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="contact-spin"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              margin: 'var(--s-4) 0 0'
            }}
          >
            {t('form_success')}
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
              margin: 'var(--s-4) 0 0'
            }}
          >
            {t('form_error')}
          </p>
        )}
      </div>
      <style jsx>{`
        .contact-spin { animation: contact-spin 1s linear infinite; }
        @keyframes contact-spin {
          from { transform: rotate(0); }
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .contact-spin { animation: none; }
        }
      `}</style>
    </form>
  );
}
