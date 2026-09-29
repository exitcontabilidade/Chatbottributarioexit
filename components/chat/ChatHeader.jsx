'use client';

import { CircleHelp, LibraryBig, Menu, SquarePen } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';

/** Barra do topo: menu (celular), título da conversa e atalhos. */
export default function ChatHeader({ title, demo, sidebarOpen, onOpenSidebar, onNewChat, onOpenTopics, onOpenHelp }) {
  return (
    <header className="flex min-h-[calc(env(safe-area-inset-top)+60px)] items-center gap-1 border-b border-line bg-bg/80 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:gap-2 sm:px-4 lg:px-6">
      <IconButton label="Abrir conversas" aria-expanded={sidebarOpen} onClick={onOpenSidebar} className="lg:hidden">
        <Menu size={20} />
      </IconButton>

      <h1 className="min-w-0 flex-1 truncate px-1 text-[15px] font-semibold">{title}</h1>

      {demo && (
        <span
          title="Respostas simuladas pelo servidor (modo demonstração)"
          className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-warning uppercase"
        >
          Demo
        </span>
      )}

      <button
        type="button"
        onClick={onOpenTopics}
        className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-fg-2 shadow-card transition hover:border-line-strong hover:text-fg sm:flex"
      >
        <LibraryBig size={16} aria-hidden="true" />
        Explorar temas
      </button>
      <IconButton label="Explorar temas" onClick={onOpenTopics} className="sm:hidden">
        <LibraryBig size={20} />
      </IconButton>

      <IconButton label="Como funciona" onClick={onOpenHelp}>
        <CircleHelp size={20} />
      </IconButton>

      <IconButton label="Nova conversa" onClick={onNewChat} className="lg:hidden">
        <SquarePen size={20} />
      </IconButton>
    </header>
  );
}
