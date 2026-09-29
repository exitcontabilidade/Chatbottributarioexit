// Token da sessão (JWT assinado com CHATBOT_SESSION_SECRET), guardado num cookie httpOnly.
//
// Fica separado de session.js porque também é usado pelo proxy.js, que roda antes
// das páginas e não tem acesso às APIs de cookies do Next.

import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'chatbot_sessao';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function secretKey() {
  const secret = process.env.CHATBOT_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CHATBOT_SESSION_SECRET não definida. Na Vercel: Settings > Environment Variables; ' +
          'em outro servidor: .env.local (ver .env.example). Depois, publique de novo.',
      );
    }
    // Só no computador de desenvolvimento.
    return new TextEncoder().encode('desenvolvimento-local-nao-usar-em-producao');
  }
  return new TextEncoder().encode(secret);
}

export function signSession(user, expiresAt) {
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
}

/** Devolve { id, name, role } se o token é válido e não expirou; senão, null. */
export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return { id: payload.sub, name: payload.name, role: payload.role };
  } catch {
    return null; // assinatura inválida, adulterado ou expirado
  }
}
