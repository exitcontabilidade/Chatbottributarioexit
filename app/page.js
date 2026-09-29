import { redirect } from 'next/navigation';
import ChatApp from '@/components/ChatApp';
import { getSession } from '@/lib/server/session';

export default async function Page() {
  const user = await getSession();
  if (!user) redirect('/login');
  return <ChatApp user={user} />;
}
