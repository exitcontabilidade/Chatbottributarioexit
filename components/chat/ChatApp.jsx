'use client';

import { useEffect, useRef, useState } from 'react';
import { makeMessage, useConversations } from '@/hooks/useConversations';
import { getStatus, sendMessage } from '@/lib/api';
import { CONFIG } from '@/lib/config';
import { titleFrom } from '@/lib/storage';
import ChatHeader from './ChatHeader';
import Composer from './Composer';
import HelpDialog from './HelpDialog';
import MessageList from './MessageList';
import Sidebar from './Sidebar';
import TopicsDialog from './TopicsDialog';
import Welcome from './Welcome';

const HELP_SEEN_KEY = 'chatbot:ajuda-vista';

function errorText(err) {
  if (!navigator.onLine) return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
  if (err?.name === 'AbortError') return 'O servidor demorou demais para responder. Tente novamente.';
  return 'Não consegui obter uma resposta agora. Tente novamente em instantes.';
}

/**
 * Tela principal do chat. Guarda o estado (conversas, janelas abertas, envio) e
 * distribui para os componentes: Sidebar, ChatHeader, Welcome/MessageList e Composer.
 */
export default function ChatApp({ user, topics }) {
  const { ready, active, conversations, update, select, startNew, remove } = useConversations(user.id);

  // Conversas esperando resposta: { [id]: true }. O ref permite decidir fora da renderização.
  const [pending, setPending] = useState({});
  const pendingRef = useRef({});

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topicsDialog, setTopicsDialog] = useState({ open: false, topic: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [demo, setDemo] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    getStatus()
      .then((status) => setDemo(Boolean(status?.demo)))
      .catch(() => {}); // servidor fora do ar: o erro aparece ao enviar a primeira mensagem

    // Na primeira visita, mostra o "Como funciona".
    try {
      if (!localStorage.getItem(HELP_SEEN_KEY)) {
        setHelpOpen(true);
        localStorage.setItem(HELP_SEEN_KEY, '1');
      }
    } catch {
      // storage bloqueado: não mostra automaticamente
    }

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
      const reply = makeMessage('assistant', res.reply, { title: res.title, note: res.note, sources: res.sources });
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

  const openTopics = (topic = null) => setTopicsDialog({ open: true, topic });
  const isPending = Boolean(active && pending[active.id]);
  const isEmpty = ready && active?.messages.length === 0;

  return (
    <div className="flex h-dvh bg-bg">
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

      <main className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={active?.title || 'Nova conversa'}
          demo={demo}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={newChat}
          onOpenTopics={() => openTopics()}
          onOpenHelp={() => setHelpOpen(true)}
        />

        {!ready ? (
          <LoadingSkeleton />
        ) : isEmpty ? (
          <Welcome userName={user.name} topics={topics} onPick={send} onOpenTopic={openTopics} onOpenHelp={() => setHelpOpen(true)} />
        ) : (
          <MessageList conversation={active} pending={isPending} onRetry={retry} onPick={send} />
        )}

        <Composer busy={isPending} onSend={send} onOpenTopics={() => openTopics()} focusKey={active?.id} />
      </main>

      <TopicsDialog
        topics={topics}
        open={topicsDialog.open}
        initialTopic={topicsDialog.topic}
        onClose={() => setTopicsDialog((d) => ({ ...d, open: false }))}
        onPick={send}
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

/** Enquanto lê as conversas salvas no navegador. */
function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 pt-8 sm:px-6" aria-hidden="true">
      <div className="ml-auto h-10 w-2/5 animate-pulse rounded-3xl bg-surface-2" />
      <div className="flex gap-3">
        <div className="size-8 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-28 flex-1 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
