import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { getSession } from '@/lib/server/session';

export const metadata = { title: 'Entrar' };

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  return <LoginForm />;
}
