// Chamadas da tela para a API (app/api/*/route.js).
//
//   POST /api/chat
//   corpo:    { conversationId, message, history: [{ role: 'user' | 'assistant', content }] }
//   resposta: { reply, title?, note?, sources: [{ title, reference, url }], suggestions: [] }
//             title = pergunta da base que está sendo respondida; note = aviso curto sobre a resposta
//
//   GET /api/status  ->  { status: 'ok', demo: boolean }
//
// `reply` pode vir em Markdown simples (negrito, itálico, listas, código, links).

import { CONFIG } from './config';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

  try {
    const res = await fetch(`/api${path}`, { ...options, signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function sendMessage(payload) {
  const data = await request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (typeof data?.reply !== 'string') throw new Error('Resposta da API sem o campo "reply"');

  const text = (value) => (typeof value === 'string' ? value : '');
  return {
    reply: data.reply,
    title: text(data.title),
    note: text(data.note),
    sources: Array.isArray(data.sources) ? data.sources.filter((s) => typeof s?.title === 'string') : [],
    suggestions: Array.isArray(data.suggestions) ? data.suggestions.filter((s) => typeof s === 'string') : [],
  };
}

export function getStatus() {
  return request('/status');
}
