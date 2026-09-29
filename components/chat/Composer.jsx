'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, LibraryBig, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LIMITS } from '@/lib/config';
import IconButton from '@/components/ui/IconButton';

const isTouchDevice = () => matchMedia('(pointer: coarse)').matches;

/** Campo de mensagem que cresce com o texto, com botão de temas e de enviar. */
export default function Composer({ busy, onSend, onOpenTopics, focusKey }) {
  const [text, setText] = useState('');
  // Em celular/tablet o Enter quebra linha (como no WhatsApp) e o envio é pelo botão.
  const [isTouch, setIsTouch] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => setIsTouch(isTouchDevice()), []);

  // No computador, o cursor já fica no campo ao abrir uma conversa (no celular abriria o teclado).
  useEffect(() => {
    if (!isTouchDevice()) inputRef.current?.focus();
  }, [focusKey]);

  // O campo cresce conforme o texto (a classe max-h limita a altura).
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
    <div className="px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-6">
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          'mx-auto flex w-full max-w-3xl items-end gap-1 rounded-[28px] border border-line bg-surface p-2 shadow-card transition',
          'focus-within:border-line-strong focus-within:ring-4 focus-within:ring-accent-soft',
        )}
      >
        <IconButton label="Explorar temas" onClick={onOpenTopics} className="rounded-full">
          <LibraryBig size={19} />
        </IconButton>

        <textarea
          ref={inputRef}
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
          // 16px evita o zoom automático do iPhone ao focar
          className="max-h-52 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-base leading-6 outline-none placeholder:text-muted focus-visible:outline-none"
        />

        {/* onMouseDown: clicar em enviar não tira o foco do campo (no celular, o teclado continua aberto). */}
        <button
          type="submit"
          aria-label={busy ? 'Aguardando resposta' : 'Enviar'}
          disabled={!canSend}
          onMouseDown={(event) => event.preventDefault()}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-brand-2 text-white shadow-card transition hover:brightness-110 active:scale-95 disabled:opacity-35 disabled:shadow-none"
        >
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
        </button>
      </form>

      <p className="mx-auto mt-2 flex w-full max-w-3xl justify-between gap-2 px-4 text-[11px] text-muted">
        <span>
          {isTouch ? (
            'Respostas informativas. Confirme com o contador.'
          ) : (
            <>
              <kbd className="rounded border border-line px-1 font-sans">Enter</kbd> envia ·{' '}
              <kbd className="rounded border border-line px-1 font-sans">Shift</kbd>+
              <kbd className="rounded border border-line px-1 font-sans">Enter</kbd> quebra linha
            </>
          )}
        </span>
        {nearLimit && (
          <span className="text-warning tabular-nums">
            {text.length}/{LIMITS.messageChars}
          </span>
        )}
      </p>
    </div>
  );
}
