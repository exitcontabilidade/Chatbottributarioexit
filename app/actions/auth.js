'use server';

// Logout como Server Action (chamada direto pelo botão "Sair").
// O login fica em app/api/auth/login/route.js, para poder responder 401 com senha errada.

import { redirect } from 'next/navigation';
import { deleteSession } from '@/lib/server/session';

export async function logout() {
  await deleteSession();
  redirect('/login');
}
