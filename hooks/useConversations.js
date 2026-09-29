'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONFIG } from '@/lib/config';
import { loadStore, saveStore } from '@/lib/storage';

export function newId() {
  // randomUUID só existe em contexto seguro (https/localhost)
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function makeMessage(role, text, extra = {}) {
  return { id: newId(), role, text, time: new Date().toISOString(), ...extra };
}

function emptyConversation() {
  const now = new Date().toISOString();
  return { id: newId(), title: '', createdAt: now, updatedAt: now, messages: [], suggestions: [] };
}

// O que vai para o localStorage: sem conversas vazias (exceto a aberta), sem mensagens
// de erro (são temporárias) e com limite de quantidade.
function toStored({ activeId, conversations }) {
  return {
    activeId,
    conversations: conversations
      .filter((c) => c.messages.length > 0 || c.id === activeId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, CONFIG.maxStoredConversations)
      .map((c) => ({
        ...c,
        messages: c.messages.filter((m) => !m.error).slice(-CONFIG.maxStoredMessages),
      })),
  };
}

/**
 * Conversas do usuário, salvas no navegador (separadas por usuário).
 * `store` é null até ler o localStorage (só existe no cliente).
 */
export function useConversations(userId) {
  const [store, setStore] = useState(null);

  useEffect(() => {
    const loaded = loadStore(userId);
    const lastActive = loaded?.conversations.find((c) => c.id === loaded.activeId);
    if (loaded && lastActive) {
      setStore(loaded);
    } else {
      const fresh = emptyConversation();
      setStore({ activeId: fresh.id, conversations: [fresh, ...(loaded?.conversations ?? [])] });
    }
  }, [userId]);

  useEffect(() => {
    if (store) saveStore(userId, toStored(store));
  }, [store, userId]);

  /** Altera uma conversa pelo id (se ela ainda existir). */
  const update = useCallback((id, change) => {
    setStore((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...change(c), updatedAt: new Date().toISOString() } : c,
      ),
    }));
  }, []);

  const select = useCallback((id) => setStore((s) => ({ ...s, activeId: id })), []);

  const startNew = useCallback(() => {
    setStore((s) => {
      const current = s.conversations.find((c) => c.id === s.activeId);
      if (current && current.messages.length === 0) return s; // já está numa conversa vazia
      const fresh = emptyConversation();
      return { activeId: fresh.id, conversations: [fresh, ...s.conversations] };
    });
  }, []);

  const remove = useCallback((id) => {
    setStore((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      if (s.activeId !== id) return { ...s, conversations };
      const fresh = emptyConversation();
      return { activeId: fresh.id, conversations: [fresh, ...conversations] };
    });
  }, []);

  const active = store?.conversations.find((c) => c.id === store.activeId) ?? null;

  // Lista lateral: só conversas com mensagens, das mais recentes para as mais antigas.
  const history = useMemo(
    () =>
      (store?.conversations ?? [])
        .filter((c) => c.messages.length > 0)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [store],
  );

  return { ready: store !== null, active, conversations: history, update, select, startNew, remove };
}
