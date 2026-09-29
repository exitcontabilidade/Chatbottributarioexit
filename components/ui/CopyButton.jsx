'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** "Copiar": copia o texto devolvido por `getText()` e mostra "Copiado!" por um instante. */
export default function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // sem permissão para a área de transferência: ignora
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="-ml-2 flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted transition hover:bg-surface-2 hover:text-fg"
    >
      {copied ? <Check size={14} className="text-success" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}
