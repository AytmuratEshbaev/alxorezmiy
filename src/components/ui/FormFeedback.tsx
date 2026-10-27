'use client';
import { useTranslations } from 'next-intl';
import FormStatus, { Spinner } from './FormStatus';
import type { SubmitError } from './Turnstile';

export type FormState = 'idle' | 'sending' | 'success' | SubmitError;

/**
 * Formaning jonli holat hududi: Turnstile kutilayotgani / yuklanmagani va yuborish natijasi.
 * 403 (tekshiruvdan o'tilmadi) va 429 (juda ko'p so'rov) umumiy xatodan alohida ko'rsatiladi.
 */
export default function FormFeedback({
  state,
  waitingReason,
  successText,
  errorText,
}: {
  state: FormState;
  waitingReason: 'verifying' | 'unavailable' | null;
  successText: string;
  errorText: string;
}) {
  const t = useTranslations('forms');
  return (
    <div role="status" aria-live="polite" className="form-feedback">
      {state === 'success' && <FormStatus kind="success">{successText}</FormStatus>}
      {state === 'error' && <FormStatus kind="error">{errorText}</FormStatus>}
      {state === 'forbidden' && <FormStatus kind="error">{t('error_forbidden')}</FormStatus>}
      {state === 'rate_limited' && <FormStatus kind="error">{t('error_rate_limited')}</FormStatus>}
      {state !== 'sending' && state !== 'success' && waitingReason === 'verifying' && (
        <FormStatus kind="info">
          <Spinner size={16} /> {t('verifying')}
        </FormStatus>
      )}
      {waitingReason === 'unavailable' && (
        <FormStatus kind="error">{t('captcha_unavailable')}</FormStatus>
      )}
    </div>
  );
}
