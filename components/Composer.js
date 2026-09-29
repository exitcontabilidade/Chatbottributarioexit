'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { LIMITS } from '@/lib/config';
import styles from './Composer.module.css';

const isTouchDevice = () => matchMedia('(pointer: coarse)').matches;

export default function Composer({ busy, onSend, focusKey }) {
  const [text, setText] = useState('');
  // Em celular/tablet o Enter quebra linha (como no WhatsApp) e o envio é pelo botão.
  const [isTouch, setIsTouch] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => setIsTouch(isTouchDevice()), []);

  // No computador, o cursor já fica no campo ao abrir uma conversa (no celular abriria o teclado).
  useEffect(() => {
    if (!isTouchDevice()) inputRef.current?.focus();
  }, [focusKey]);

  // O campo cresce conforme o texto (o CSS limita a altura máxima).
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }, [text]);

  const canSend = !busy && text.trim().length > 0;
  const nearLimit = text.length > LIMITS.messageChars * 0.8;

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText('');
  }

  return (
    <div className={styles.dock}>
      <form
        className={styles.box}
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={1}
          maxLength={LIMITS.messageChars}
          placeholder="Pergunte sobre a Reforma Tributária…"
          aria-label="Mensagem"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !isTouch) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {/* onMouseDown: clicar em enviar não tira o foco do campo (no celular, o teclado continua aberto). */}
        <button
          className={styles.send}
          type="submit"
          aria-label={busy ? 'Aguardando resposta' : 'Enviar'}
          disabled={!canSend}
          onMouseDown={(event) => event.preventDefault()}
        >
          {busy ? <LoaderCircle size={18} className={styles.spin} /> : <ArrowUp size={18} strokeWidth={2.4} />}
        </button>
      </form>

      {(!isTouch || nearLimit) && (
        <p className={styles.hint}>
          {!isTouch && (
            <span>
              <kbd>Enter</kbd> envia · <kbd>Shift</kbd>+<kbd>Enter</kbd> quebra linha
            </span>
          )}
          {nearLimit && (
            <span className={styles.counter}>
              {text.length}/{LIMITS.messageChars}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
