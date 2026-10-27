'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Turnstile, { submitErrorFromStatus, useTurnstileGate } from '@/components/ui/Turnstile';
import FormFeedback, { type FormState } from '@/components/ui/FormFeedback';
import { SendIcon, Spinner } from '@/components/ui/FormStatus';

type FieldErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>;

export default function ContactForm() {
  const t = useTranslations('contact_page');
  const [status, setStatus] = useState<FormState>('idle');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [website, setWebsite] = useState(''); // honeypot — always empty for humans
  const [errors, setErrors] = useState<FieldErrors>({});
  const turnstile = useTurnstileGate();

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = t('error_name');
    if (!form.email.trim()) next.email = t('error_email');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = t('error_email_invalid');
    if (!form.subject.trim()) next.subject = t('error_subject');
    if (!form.message.trim()) next.message = t('error_message');
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (turnstile.blocked) return;
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const firstKey = (['name', 'email', 'subject', 'message'] as const).find((k) => found[k]);
      if (firstKey) {
        const map = {
          name: 'contactName',
          email: 'contactEmail',
          subject: 'contactSubject',
          message: 'contactMessage',
        } as const;
        document.getElementById(map[firstKey])?.focus();
      }
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website, turnstileToken: turnstile.token }),
      });
      if (!res.ok) {
        setStatus(submitErrorFromStatus(res.status));
        return;
      }
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Send error:', err);
      setStatus('error');
    } finally {
      // Token bir martalik — har urinishdan keyin yangisi olinadi.
      turnstile.reset();
    }
  }

  const sending = status === 'sending';
  return (
    <form onSubmit={onSubmit} aria-busy={sending} noValidate>
      <fieldset disabled={sending} style={{ border: 0, padding: 0, margin: 0 }}>
        {/* Honeypot: hidden from humans, catches bots. Not submitted by real users. */}
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="contactWebsite">Website</label>
          <input
            type="text"
            id="contactWebsite"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
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
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'contactName-error' : undefined}
          />
          {errors.name && (
            <p id="contactName-error" role="alert" className="field-error">
              {errors.name}
            </p>
          )}
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
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'contactEmail-error' : undefined}
          />
          {errors.email && (
            <p id="contactEmail-error" role="alert" className="field-error">
              {errors.email}
            </p>
          )}
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
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? 'contactSubject-error' : undefined}
          />
          {errors.subject && (
            <p id="contactSubject-error" role="alert" className="field-error">
              {errors.subject}
            </p>
          )}
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
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? 'contactMessage-error' : undefined}
          />
          {errors.message && (
            <p id="contactMessage-error" role="alert" className="field-error">
              {errors.message}
            </p>
          )}
        </div>
        <Turnstile {...turnstile.props} />
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={sending || turnstile.blocked}
        >
          <span>{sending ? t('form_sending') : t('form_send')}</span>
          {sending ? <Spinner /> : <SendIcon />}
        </button>
      </fieldset>
      <FormFeedback
        state={status}
        waitingReason={turnstile.waitingReason}
        successText={t('form_success')}
        errorText={t('form_error')}
      />
    </form>
  );
}
