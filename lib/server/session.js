// Sessão do usuário logado: criar (login), ler e apagar (logout).

import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_DURATION_MS, signSession, verifySession } from './token';

export async function createSession(user) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await signSession(user, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // o JavaScript da página não consegue ler o cookie
    secure: process.env.NODE_ENV === 'production', // só HTTPS em produção
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/** Usuário logado ({ id, name, role }) ou null. */
export async function getSession() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// 401 Unauthorized: falta autenticação ou ela falhou (RFC 9110, seção 15.5.2).
// A especificação exige o cabeçalho WWW-Authenticate; "Form" indica que o login é
// pelo formulário do site (o navegador não abre a janelinha de senha para esse tipo).
export function unauthorized(detail) {
  return Response.json({ detail }, { status: 401, headers: { 'WWW-Authenticate': 'Form realm="chatbot"' } });
}
