'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, CornerDownRight } from 'lucide-react';
import Message, { TypingIndicator } from './Message';
import styles from './MessageList.module.css';

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
    <div className={styles.wrapper}>
      <div className={styles.scroll} ref={scrollRef} onScroll={onScroll}>
        <div className={styles.column} role="log" aria-live="polite" aria-label="Mensagens" aria-busy={pending}>
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} onRetry={onRetry} />
          ))}

          {pending && <TypingIndicator />}

          {showRelated && (
            <div className={styles.related}>
              <p className={styles.relatedTitle}>Perguntas relacionadas</p>
              {suggestions.map((text) => (
                <button key={text} type="button" className={styles.relatedItem} onClick={() => onPick(text)}>
                  <CornerDownRight size={16} />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <button type="button" className={styles.jump} aria-label="Ir para a última mensagem" onClick={() => scrollToBottom()}>
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
}
