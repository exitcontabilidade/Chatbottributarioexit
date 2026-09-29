// Confere o corpo de POST /api/chat. Os limites protegem o servidor e o custo por
// pergunta contra requisições gigantes (ex.: alguém colando uma lei inteira ou um SPED).

import 'server-only';
import { LIMITS } from '@/lib/config';

export class ValidationError extends Error {}

export function parseChatRequest(body) {
  if (!body || typeof body !== 'object') throw new ValidationError('Corpo da requisição inválido.');
  const { conversationId, message, history = [] } = body;

  if (typeof conversationId !== 'string' || !conversationId || conversationId.length > 100) {
    throw new ValidationError('conversationId inválido.');
  }

  const text = typeof message === 'string' ? message.trim() : '';
  if (!text || text.length > LIMITS.messageChars) {
    throw new ValidationError(`A mensagem deve ter entre 1 e ${LIMITS.messageChars} caracteres.`);
  }

  if (!Array.isArray(history) || history.length > LIMITS.historyItems) {
    throw new ValidationError(`O histórico deve ter no máximo ${LIMITS.historyItems} mensagens.`);
  }
  const cleanHistory = history.map((item) => {
    const valid =
      (item?.role === 'user' || item?.role === 'assistant') &&
      typeof item.content === 'string' &&
      item.content.length <= LIMITS.historyItemChars;
    if (!valid) throw new ValidationError('Histórico inválido.');
    return { role: item.role, content: item.content };
  });

  return { conversationId, message: text, history: cleanHistory };
}
