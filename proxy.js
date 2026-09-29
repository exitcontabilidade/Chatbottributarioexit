// Roda antes de cada página: quem não está logado vai para /login, e quem já está
// logado não precisa ver o /login de novo.
//
// É só a primeira barreira (checagem rápida do cookie). A página e a API conferem a
// sessão de novo antes de mostrar ou responder qualquer coisa.

import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/server/token';

const PUBLIC_PATHS = ['/login'];

export default async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!session && !isPublic) return NextResponse.redirect(new URL('/login', request.nextUrl));
  if (session && isPublic) return NextResponse.redirect(new URL('/', request.nextUrl));
  return NextResponse.next();
}

// Não passa pelo proxy: a API (confere a sessão sozinha), arquivos do Next, ícones,
// service worker e manifest (o PWA precisa deles mesmo na tela de login).
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|icons/|sw\\.js|manifest\\.webmanifest|favicon\\.ico).*)'],
};
