import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/admin');
  return <LoginForm />;
}
