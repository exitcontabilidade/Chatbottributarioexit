'use client';

import { useMemo, useState } from 'react';
import { LogOut, MessageSquare, Search, SearchX, SquarePen, Trash2, X } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { cn } from '@/lib/cn';
import { CONFIG } from '@/lib/config';
import InstallButton from '@/components/pwa/InstallButton';
import IconButton from '@/components/ui/IconButton';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';

const DAY = 24 * 60 * 60 * 1000;
const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function groupLabel(iso, today) {
  const date = new Date(iso);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today - day) / DAY);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return 'Últimos 7 dias';
  if (days < 30) return 'Últimos 30 dias';
  return 'Mais antigas';
}

/** Agrupa as conversas (já ordenadas da mais recente) por período. */
function groupByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups = [];
  for (const conv of conversations) {
    const label = groupLabel(conv.updatedAt, today);
    if (groups.at(-1)?.label !== label) groups.push({ label, items: [] });
    groups.at(-1).items.push(conv);
  }
  return groups;
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase() || '?';
}

/**
 * Barra lateral: nova conversa, busca, histórico e conta.
 * A partir de 1024px fica fixa; abaixo disso vira uma gaveta aberta pelo botão ☰.
 */
export default function Sidebar({ open, onClose, conversations, activeId, onSelect, onNew, onDelete, online, user }) {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const found = q ? conversations.filter((c) => normalize(c.title).includes(q)) : conversations;
    return groupByDate(found);
  }, [conversations, query]);

  return (
    <>
      {/* Fundo escuro atrás da gaveta (celular/tablet) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        aria-label="Conversas"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r border-line bg-bg-subtle shadow-pop',
          'pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+12px)]',
          'transition-[translate,visibility] duration-300 ease-out',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
          'lg:visible lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:shadow-none',
        )}
      >
        {/* Marca */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <Logo size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] leading-tight font-semibold">{CONFIG.botName}</p>
            <p className="text-xs text-muted">{CONFIG.tagline}</p>
          </div>
          <IconButton label="Fechar menu" onClick={onClose} className="-mr-1 lg:hidden">
            <X size={20} />
          </IconButton>
        </div>

        {/* Ações */}
        <div className="space-y-2 px-3">
          <button
            type="button"
            onClick={onNew}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand to-brand-2 text-sm font-semibold text-white shadow-card transition hover:brightness-110 active:scale-[0.99]"
          >
            <SquarePen size={17} aria-hidden="true" />
            Nova conversa
          </button>

          <label className="relative block">
            <span className="sr-only">Buscar conversas</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar conversas"
              className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </label>
        </div>

        {/* Histórico */}
        <nav aria-label="Histórico de conversas" className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted">
              {query ? <SearchX size={28} aria-hidden="true" /> : <MessageSquare size={28} aria-hidden="true" />}
              <p>{query ? 'Nenhuma conversa encontrada.' : 'Suas conversas vão aparecer aqui.'}</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="mb-4">
                <h2 className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{group.label}</h2>
                <ul className="space-y-0.5">
                  {group.items.map((conv) => {
                    const isActive = conv.id === activeId;
                    const title = conv.title || 'Conversa sem título';
                    return (
                      <li
                        key={conv.id}
                        className={cn(
                          'group relative flex items-center rounded-xl transition-colors',
                          isActive ? 'bg-surface-3' : 'hover:bg-surface-2',
                        )}
                      >
                        {isActive && <span className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-accent" aria-hidden="true" />}
                        <button
                          type="button"
                          title={title}
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => onSelect(conv.id)}
                          className={cn(
                            'min-w-0 flex-1 truncate rounded-xl py-2.5 pr-1 pl-3.5 text-left text-sm',
                            isActive ? 'font-medium text-fg' : 'text-fg-2',
                          )}
                        >
                          {title}
                        </button>
                        <button
                          type="button"
                          aria-label={`Apagar a conversa "${title}"`}
                          title="Apagar"
                          onClick={() => onDelete(conv)}
                          className={cn(
                            'mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted transition',
                            'hover:bg-danger-soft hover:text-danger',
                            'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
                            isActive && 'lg:opacity-100',
                          )}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </nav>

        {/* Rodapé: instalar, tema e conta */}
        <div className="space-y-3 border-t border-line px-3 pt-3">
          <InstallButton />
          <ThemeToggle />
          <div className="flex items-center gap-3 rounded-xl px-1">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-brand-2 text-[13px] font-semibold text-white"
              aria-hidden="true"
            >
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-medium">{user.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn('size-2 rounded-full', online ? 'bg-success' : 'bg-muted')} aria-hidden="true" />
                {online ? 'Online' : 'Sem conexão'}
              </p>
            </div>
            <form action={logout}>
              <IconButton type="submit" label="Sair">
                <LogOut size={18} />
              </IconButton>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
