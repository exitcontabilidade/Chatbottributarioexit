'use client';

import { useMemo, useRef, useState } from 'react';
import { BookOpen, Check, CircleAlert, Copy, ExternalLink, Info, RotateCcw } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import { renderMarkdown } from '@/lib/markdown';
import styles from './Message.module.css';

const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatTime = (iso) => timeFormat.format(new Date(iso));

function BotAvatar() {
  return <img className={styles.avatar} src="/icons/icon.svg" alt="" width={28} height={28} />;
}

export default function Message({ msg, onRetry }) {
  const isUser = msg.role === 'user';
  const contentRef = useRef(null);
  // Respostas do bot vêm em Markdown; o renderMarkdown escapa todo o HTML antes de formatar.
  const html = useMemo(() => (isUser || msg.error ? null : renderMarkdown(msg.text)), [isUser, msg.error, msg.text]);

  if (isUser) {
    return (
      <div className={styles.userRow}>
        <span className="sr-only">Você: </span>
        <div className={styles.userBubble}>{msg.text}</div>
        <time className={styles.userTime} dateTime={msg.time}>
          {formatTime(msg.time)}
        </time>
      </div>
    );
  }

  const fromApi = Array.isArray(msg.sources); // respostas da API recebem fontes + aviso fixo

  return (
    <div className={styles.botRow}>
      <BotAvatar />
      <div className={styles.botBody}>
        <span className="sr-only">{CONFIG.botName}: </span>

        {msg.error ? (
          <div className={styles.errorCard}>
            <CircleAlert size={18} className={styles.errorIcon} />
            <span className={styles.errorText}>{msg.text}</span>
            <button type="button" className={styles.retry} onClick={() => onRetry(msg)}>
              <RotateCcw size={14} />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div ref={contentRef} className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
        )}

        {fromApi && msg.sources.length > 0 && <Sources sources={msg.sources} />}

        {fromApi && (
          <p className={styles.disclaimer}>
            <Info size={13} />
            {CONFIG.disclaimer}
          </p>
        )}

        {!msg.error && (
          <div className={styles.actions}>
            <CopyButton getText={() => contentRef.current?.innerText ?? msg.text} />
            <time className={styles.time} dateTime={msg.time}>
              {formatTime(msg.time)}
            </time>
          </div>
        )}
      </div>
    </div>
  );
}

function Sources({ sources }) {
  return (
    <div className={styles.sources}>
      <span className={styles.sourcesLabel}>
        <BookOpen size={14} />
        Fontes
      </span>
      <div className={styles.sourceList}>
        {sources.map((source, i) => {
          const label = source.reference ? `${source.title}, ${source.reference}` : source.title;
          const isLink = typeof source.url === 'string' && /^https?:\/\//i.test(source.url);
          return isLink ? (
            <a key={i} className={styles.sourceChip} href={source.url} target="_blank" rel="noopener noreferrer">
              {label}
              <ExternalLink size={12} />
            </a>
          ) : (
            <span key={i} className={styles.sourceChip}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // sem permissão para a área de transferência: ignora
    }
  }

  return (
    <button
      type="button"
      className={styles.action}
      onClick={copy}
      aria-label={copied ? 'Copiado' : 'Copiar resposta'}
      title={copied ? 'Copiado' : 'Copiar'}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export function TypingIndicator() {
  return (
    <div className={styles.botRow}>
      <BotAvatar />
      <div className={styles.typing} role="status" aria-label={`${CONFIG.botName} está digitando`}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
