'use client';

import { BookOpen, Download, HardDrive, Keyboard, MessageSquareText, Search, ShieldCheck } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';

const STEPS = [
  {
    Icon: MessageSquareText,
    title: 'Pergunte com suas palavras',
    text: 'Escreva sua dúvida sobre a Reforma Tributária ou leia as respostas prontas em "Explorar temas": é só tocar numa pergunta.',
  },
  {
    Icon: Search,
    title: 'O assistente procura na base',
    text: 'Ele encontra a pergunta cadastrada mais parecida com a sua e mostra, em destaque, qual está respondendo.',
  },
  {
    Icon: BookOpen,
    title: 'Leia a resposta e aprofunde',
    text: 'Veja as fontes (quando houver) e clique nas perguntas relacionadas para continuar.',
  },
  {
    Icon: ShieldCheck,
    title: 'Confirme com o contador',
    text: 'As respostas são informativas e não substituem a análise do contador.',
  },
];

const TIPS = [
  { Icon: Keyboard, text: 'Enter envia a mensagem; Shift + Enter quebra a linha.' },
  { Icon: HardDrive, text: 'Suas conversas ficam salvas neste navegador.' },
  { Icon: Download, text: 'Dá para instalar como app pelo botão "Instalar app" no menu.' },
];

/** Janela "Como funciona": passo a passo e dicas. */
export default function HelpDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Como funciona" description="Um guia rápido para usar o assistente." className="sm:max-w-lg">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <ol className="space-y-4">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title} className="flex gap-4">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon size={19} aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-linear-to-br from-brand to-brand-2 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-0.5 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 space-y-2.5 rounded-2xl bg-surface-2 p-4">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">Dicas</p>
          {TIPS.map(({ Icon, text }) => (
            <p key={text} className="flex items-start gap-2.5 text-sm text-fg-2">
              <Icon size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              {text}
            </p>
          ))}
        </div>
      </div>

      <div className="border-t border-line px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-xl bg-linear-to-r from-brand to-brand-2 text-sm font-semibold text-white shadow-card transition hover:brightness-110"
        >
          Entendi, vamos lá
        </button>
      </div>
    </Dialog>
  );
}
