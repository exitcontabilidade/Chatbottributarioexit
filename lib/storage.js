// Guarda as conversas no navegador (localStorage), para sobreviverem a um recarregamento.
// Se o storage estiver bloqueado (aba anônima, cookies desativados), o chat funciona sem salvar.
//
// Formato: { activeId, conversations: [{ id, title, createdAt, updatedAt, messages, suggestions }] }

const KEY = 'chatbot:conversas:v2';
const OLD_KEY = 'chatbot:conversa:v1'; // versão anterior, com uma conversa só

const isConversation = (c) => c && typeof c.id === 'string' && Array.isArray(c.messages);

function normalizeConversation(c) {
  const firstTime = c.messages[0]?.time ?? new Date().toISOString();
  const lastTime = c.messages.at(-1)?.time ?? firstTime;
  return {
    id: c.id,
    title: typeof c.title === 'string' ? c.title : '',
    createdAt: c.createdAt ?? firstTime,
    updatedAt: c.updatedAt ?? lastTime,
    messages: c.messages,
    suggestions: Array.isArray(c.suggestions) ? c.suggestions : [],
  };
}

// A versão anterior começava com a mensagem de boas-vindas; a nova usa uma tela inicial.
function migrateOld(old) {
  const firstUser = old.messages.findIndex((m) => m.role === 'user');
  if (firstUser < 0) return null;
  const messages = old.messages.slice(firstUser);
  return normalizeConversation({ ...old, title: titleFrom(messages[0].text), messages });
}

export function titleFrom(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean;
}

export function loadStore() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data && Array.isArray(data.conversations)) {
      return {
        activeId: typeof data.activeId === 'string' ? data.activeId : null,
        conversations: data.conversations.filter(isConversation).map(normalizeConversation),
      };
    }

    const old = JSON.parse(localStorage.getItem(OLD_KEY));
    if (isConversation(old)) {
      const migrated = migrateOld(old);
      if (migrated) return { activeId: migrated.id, conversations: [migrated] };
    }
  } catch {
    // storage indisponível ou conteúdo corrompido: começa do zero
  }
  return null;
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // sem espaço ou storage bloqueado: segue sem salvar
  }
}
