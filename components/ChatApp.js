'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, SquarePen } from 'lucide-react';
import { makeMessage, useConversations } from '@/hooks/useConversations';
import { getStatus, sendMessage } from '@/lib/api';
import { CONFIG } from '@/lib/config';
import { titleFrom } from '@/lib/storage';
import Composer from './Composer';
import MessageList from './MessageList';
import Sidebar from './Sidebar';
import Welcome from './Welcome';
import styles from './ChatApp.module.css';

function errorText(err) {
  if (!navigator.onLine) return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
  if (err?.name === 'AbortError') return 'O servidor demorou demais para responder. Tente novamente.';
  return 'Não consegui obter uma resposta agora. Tente novamente em instantes.';
}

export default function ChatApp({ user }) {
  const { ready, active, conversations, update, select, startNew, remove } = useConversations(user.id);

  // Conversas esperando resposta: { [id]: true }. O ref permite decidir fora da renderização.
  const [pending, setPending] = useState({});
  const pendingRef = useRef({});

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demo, setDemo] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    getStatus()
      .then((status) => setDemo(Boolean(status?.demo)))
      .catch(() => {}); // servidor fora do ar: o erro aparece ao enviar a primeira mensagem

    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  // Esc fecha o menu lateral (celular/tablet).
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event) => event.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  function setPendingFor(id, value) {
    const next = { ...pendingRef.current };
    if (value) next[id] = true;
    else delete next[id];
    pendingRef.current = next;
    setPending(next);
  }

  async function ask(conv, text) {
    // Contexto: mensagens anteriores à pergunta atual (a última da lista é a própria pergunta).
    const history = conv.messages
      .filter((m) => !m.error)
      .slice(0, -1)
      .slice(-CONFIG.historyLimit)
      .map((m) => ({ role: m.role, content: m.text }));

    setPendingFor(conv.id, true);
    try {
      const res = await sendMessage({ conversationId: conv.id, message: text, history });
      // `sources` também marca a mensagem como resposta da API (recebe o aviso fixo).
      const reply = makeMessage('assistant', res.reply, { sources: res.sources });
      update(conv.id, (c) => ({ ...c, messages: [...c.messages, reply], suggestions: res.suggestions }));
    } catch (err) {
      if (err?.status === 401) {
        window.location.assign('/login'); // sessão expirou: entrar de novo
        return;
      }
      console.error('Falha ao obter resposta:', err);
      const failure = makeMessage('assistant', errorText(err), { error: true, retryText: text });
      update(conv.id, (c) => ({ ...c, messages: [...c.messages, failure] }));
    } finally {
      setPendingFor(conv.id, false);
    }
  }

  function send(text) {
    const clean = text.trim();
    if (!clean || !active || pendingRef.current[active.id]) return;
    const conv = {
      ...active,
      title: active.title || titleFrom(clean),
      messages: [...active.messages, makeMessage('user', clean)],
      suggestions: [],
    };
    update(conv.id, () => conv);
    ask(conv, clean);
  }

  function retry(errorMsg) {
    if (!active || pendingRef.current[active.id]) return;
    const conv = { ...active, messages: active.messages.filter((m) => m.id !== errorMsg.id) };
    update(conv.id, () => conv);
    ask(conv, errorMsg.retryText);
  }

  function newChat() {
    startNew();
    setSidebarOpen(false);
  }

  function openConversation(id) {
    select(id);
    setSidebarOpen(false);
  }

  function deleteConversation(conv) {
    if (window.confirm(`Apagar a conversa "${conv.title || 'sem título'}"?`)) remove(conv.id);
  }

  const isPending = Boolean(active && pending[active.id]);
  const isEmpty = ready && active?.messages.length === 0;

  return (
    <div className={styles.shell}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={active?.id}
        onSelect={openConversation}
        onNew={newChat}
        onDelete={deleteConversation}
        online={online}
        user={user}
      />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={`${styles.iconBtn} ${styles.mobileOnly}`}
            type="button"
            aria-label="Abrir conversas"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className={styles.title}>{active?.title || 'Nova conversa'}</h1>
          {demo && (
            <span className={styles.badge} title="Respostas simuladas pelo servidor (modo demonstração)">
              Demo
            </span>
          )}
          <button
            className={`${styles.iconBtn} ${styles.mobileOnly}`}
            type="button"
            aria-label="Nova conversa"
            onClick={newChat}
          >
            <SquarePen size={20} />
          </button>
        </header>

        {!ready ? (
          <div className={styles.placeholder} />
        ) : isEmpty ? (
          <Welcome onPick={send} />
        ) : (
          <MessageList conversation={active} pending={isPending} onRetry={retry} onPick={send} />
        )}

        <Composer busy={isPending} onSend={send} focusKey={active?.id} />
      </main>
    </div>
  );
}
