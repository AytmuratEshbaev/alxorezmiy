import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { getBotToken } from '@/lib/telegram/bot';
import LoginForm from './LoginForm';

type Props = { searchParams: Promise<{ next?: string }> };

/** Faqat panel ichidagi yo'llarga qaytaramiz (open redirect bo'lmasin). */
function safeNext(next: string | undefined): string {
  return next && /^\/admin(\/[\w\-/]*)?$/.test(next) && !/^\/admin\/login(?:\/|$)/.test(next)
    ? next
    : '/admin';
}

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);
  if (await getSessionUser()) redirect(next);
  return <LoginForm configured={!!getBotToken()} next={next} />;
}
