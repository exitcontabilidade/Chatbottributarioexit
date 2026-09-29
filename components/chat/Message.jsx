'use client';

import { useMemo, useRef } from 'react';
import { CircleAlert, Info, RotateCcw } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import { renderMarkdown } from '@/lib/markdown';
import CopyButton from '@/components/ui/CopyButton';
import Logo from '@/components/ui/Logo';
import Sources from './Sources';

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatTime = (iso) => timeFormat.format(new Date(iso));

/** Uma mensagem da conversa: do usuário (balão à direita) ou do assistente (cartão à esquerda). */
export default function Message({ msg, onRetry }) {
  return msg.role === 'user' ? <UserMessage msg={msg} /> : <BotMessage msg={msg} onRetry={onRetry} />;
}

function UserMessage({ msg }) {
  return (
    <div className="group flex animate-fade-up flex-col items-end gap-1">
      <span className="sr-only">Você: </span>
      <div className="max-w-[min(85%,36rem)] rounded-3xl rounded-br-md bg-linear-to-br from-brand to-brand-2 px-4 py-2.5 whitespace-pre-wrap text-white shadow-card [overflow-wrap:anywhere]">
        {msg.text}
      </div>
      <time
        dateTime={msg.time}
        className="pr-2 text-[11px] text-muted opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
      >
        {formatTime(msg.time)}
      </time>
    </div>
  );
}

function BotMessage({ msg, onRetry }) {
  const contentRef = useRef(null);
  // Resposta em Markdown; o renderMarkdown escapa todo o HTML antes de formatar.
  const html = useMemo(() => (msg.error ? '' : renderMarkdown(msg.text)), [msg.error, msg.text]);
  const fromApi = Array.isArray(msg.sources); // respostas da API recebem o aviso fixo

  return (
    <div className="flex animate-fade-up gap-3">
      <Logo size={32} className="mt-0.5 shadow-card" />

      <div className="min-w-0 flex-1">
        <p className="mb-1.5 flex items-baseline gap-2 text-sm">
          <span className="font-semibold">{CONFIG.botName}</span>
          <time dateTime={msg.time} className="text-xs text-muted">
            {formatTime(msg.time)}
          </time>
        </p>

        {msg.error ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            <CircleAlert size={18} className="shrink-0" aria-hidden="true" />
            <span className="min-w-44 flex-1">{msg.text}</span>
            <button
              type="button"
              onClick={() => onRetry(msg)}
              className="flex items-center gap-1.5 rounded-full border border-current px-3 py-1.5 text-[13px] font-medium transition hover:bg-danger/10"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <article className="overflow-hidden rounded-2xl rounded-tl-md border border-line bg-surface shadow-card">
              <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                {msg.note && (
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-warning">
                    <Info size={14} aria-hidden="true" />
                    {msg.note}
                  </p>
                )}
                <div ref={contentRef}>
                  {/* Pergunta da base que está sendo respondida */}
                  {msg.title && <h3 className="mb-1.5 font-semibold leading-snug text-fg">{msg.title}</h3>}
                  <div className="markdown text-fg-2" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
                {fromApi && msg.sources.length > 0 && <Sources sources={msg.sources} />}
              </div>

              {fromApi && (
                <p className="flex items-start gap-2 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted sm:px-5">
                  <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
                  {CONFIG.disclaimer}
                </p>
              )}
            </article>

            <div className="mt-1.5 flex items-center">
              <CopyButton getText={() => contentRef.current?.innerText ?? msg.text} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** "Digitando…" enquanto a resposta não chega. */
export function TypingIndicator() {
  return (
    <div className="flex animate-fade-up gap-3" role="status" aria-label={`${CONFIG.botName} está respondendo`}>
      <Logo size={32} className="mt-0.5 shadow-card" />
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3 shadow-card">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-2 animate-blink rounded-full bg-accent" />
          <span className="size-2 animate-blink rounded-full bg-accent [animation-delay:150ms]" />
          <span className="size-2 animate-blink rounded-full bg-accent [animation-delay:300ms]" />
        </span>
        <span className="text-sm text-muted">Procurando a melhor resposta…</span>
      </div>
    </div>
  );
}
