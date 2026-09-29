'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, CornerDownRight } from 'lucide-react';
import Message, { TypingIndicator } from './Message';

/** Lista de mensagens com rolagem automática, "digitando…" e perguntas relacionadas. */
export default function MessageList({ conversation, pending, onRetry, onPick }) {
  const { id, messages, suggestions } = conversation;
  const last = messages.at(-1);

  const scrollRef = useRef(null);
  const atBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  function scrollToBottom(behavior = 'smooth') {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // Ao abrir outra conversa: vai direto para o fim, sem animação.
  useLayoutEffect(() => {
    scrollToBottom('auto');
    atBottomRef.current = true;
    setShowJump(false);
  }, [id]);

  // Mensagem nova: acompanha se o usuário estava no fim (ou se foi ele quem enviou).
  useEffect(() => {
    if (last?.role === 'user' || atBottomRef.current) scrollToBottom();
  }, [messages.length, pending]);

  function onScroll() {
    const el = scrollRef.current;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distance < 80;
    setShowJump(distance > 240);
  }

  const showRelated = !pending && suggestions.length > 0 && last?.role === 'assistant';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
        <div
          role="log"
          aria-live="polite"
          aria-label="Mensagens"
          aria-busy={pending}
          className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-4 sm:px-6 sm:pt-8"
        >
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} onRetry={onRetry} />
          ))}

          {pending && <TypingIndicator />}

          {showRelated && (
            <div className="animate-fade-up sm:pl-11">
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Perguntas relacionadas</p>
              <div className="flex flex-col gap-2">
                {suggestions.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => onPick(text)}
                    className="group flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-fg-2 transition hover:border-accent/50 hover:bg-accent-soft hover:text-fg"
                  >
                    <CornerDownRight size={16} className="mt-0.5 shrink-0 text-muted group-hover:text-accent" aria-hidden="true" />
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          aria-label="Ir para a última mensagem"
          onClick={() => scrollToBottom()}
          className="absolute bottom-3 left-1/2 grid size-10 -translate-x-1/2 animate-fade-up place-items-center rounded-full border border-line bg-surface text-fg-2 shadow-pop transition hover:text-fg"
        >
          <ArrowDown size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
