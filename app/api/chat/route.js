import { getResponder } from '@/lib/server/responder';
import { getSession, unauthorized } from '@/lib/server/session';
import { parseChatRequest, ValidationError } from '@/lib/server/validation';

const MAX_BODY_BYTES = 1_000_000;

// POST /api/chat — contrato em lib/api.js
export async function POST(request) {
  if (!(await getSession())) return unauthorized('Faça login para continuar.');
  // Só JSON: impede que outro site envie mensagens por um formulário comum.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ detail: 'Envie os dados como JSON.' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    return Response.json({ detail: 'Requisição grande demais.' }, { status: 413 });
  }

  let chat;
  try {
    chat = parseChatRequest(await request.json());
  } catch (err) {
    const detail = err instanceof ValidationError ? err.message : 'JSON inválido.';
    return Response.json({ detail }, { status: 422 });
  }

  try {
    return Response.json(await getResponder().reply(chat));
  } catch (err) {
    // O detalhe do erro fica só no log do servidor; o usuário recebe uma mensagem genérica.
    console.error(`Falha ao gerar resposta (conversa ${JSON.stringify(chat.conversationId)}):`, err);
    return Response.json({ detail: 'Não foi possível gerar a resposta.' }, { status: 502 });
  }
}
