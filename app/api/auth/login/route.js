import { checkCredentials } from '@/lib/server/auth';
import { createSession, unauthorized } from '@/lib/server/session';

const MAX_BODY_BYTES = 10_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/auth/login  { username, password }
//   200 -> logado (cookie de sessão gravado)
//   400 -> faltou usuário ou senha
//   401 -> usuário ou senha incorretos
export async function POST(request) {
  // Só JSON: impede que outro site faça login por um formulário comum.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ detail: 'Envie os dados como JSON.' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    return Response.json({ detail: 'Requisição grande demais.' }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ detail: 'JSON inválido.' }, { status: 400 });
  }

  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!username || !password) {
    return Response.json({ detail: 'Informe o usuário e a senha.' }, { status: 400 });
  }

  const user = await checkCredentials(username, password);
  if (!user) {
    await sleep(400); // atrasa um pouco quem tenta adivinhar senhas
    return unauthorized('Usuário ou senha incorretos.');
  }

  await createSession(user);
  return Response.json({ ok: true });
}
