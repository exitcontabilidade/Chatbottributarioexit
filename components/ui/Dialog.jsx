'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import IconButton from './IconButton';

/**
 * Janela sobre a tela (usa o <dialog> do navegador: Esc fecha e o foco fica preso nela).
 * No celular ocupa a tela toda; a partir de 640px vira uma janela centralizada.
 */
export default function Dialog({ open, onClose, title, description, className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clique no fundo escuro (fora da caixa) fecha.
      onClick={(event) => event.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        'm-0 h-dvh max-h-none w-full max-w-none bg-surface p-0 text-fg',
        'sm:m-auto sm:h-auto sm:max-h-[85dvh] sm:w-[calc(100%-2rem)] sm:rounded-3xl sm:border sm:border-line sm:shadow-pop',
        'backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-pop-in',
        className,
      )}
    >
      <div className="flex h-full max-h-[inherit] flex-col">
        <header className="flex items-start gap-3 border-b border-line px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose} className="-mr-2 -mt-1">
            <X size={20} />
          </IconButton>
        </header>
        {children}
      </div>
    </dialog>
  );
}
