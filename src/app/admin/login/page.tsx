'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': "Email yoki parol noto'g'ri",
  'auth/invalid-email': "Email format noto'g'ri",
  'auth/user-not-found': 'Bunday foydalanuvchi topilmadi',
  'auth/wrong-password': "Parol noto'g'ri",
  'auth/too-many-requests': "Juda ko'p urinish. Biroz kuting.",
  'auth/network-request-failed': 'Internet aloqasini tekshiring'
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/admin');
    } catch (err) {
      const code = (err as AuthError).code;
      setError(ERROR_MESSAGES[code] || `Xatolik: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">AX</div>
        <h1 className="login-title">Tizimga kirish</h1>
        <p className="login-desc">Maktab admin paneliga xush kelibsiz</p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, .08)',
                color: '#B91C1C',
                border: '1px solid rgba(239, 68, 68, .25)',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.875rem',
                textAlign: 'left',
                marginBottom: 16,
                fontWeight: 500
              }}
            >
              {error}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Elektron pochta</label>
            <input
              type="email"
              id="email"
              className="form-control"
              required
              placeholder="admin@alxorazmiy.uz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label htmlFor="password">Parol</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-control"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 80 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '6px 10px',
                  borderRadius: 6
                }}
              >
                {showPassword ? 'Yashirish' : "Ko'rsatish"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Yuklanmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
