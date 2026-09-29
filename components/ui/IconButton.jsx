import { cn } from '@/lib/cn';

/** Botão só com ícone. `label` vira o texto para leitores de tela e a dica ao passar o mouse. */
export default function IconButton({ label, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid size-10 shrink-0 place-items-center rounded-xl text-fg-2 transition-colors',
        'hover:bg-surface-2 hover:text-fg active:bg-surface-3 disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
