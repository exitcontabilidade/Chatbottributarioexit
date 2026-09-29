'use client';

import { useMemo } from 'react';
import { ArrowUpRight, CircleHelp } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import Logo from '@/components/ui/Logo';
import TopicBadge from '@/components/ui/TopicBadge';
import { grupoKey } from './TopicsDialog';

/** Tela da conversa vazia: saudação, perguntas populares e temas (um cartão por lei/grupo). */
export default function Welcome({ userName, topics, onPick, onOpenTopic, onOpenHelp }) {
  const { title, subtitle, cards } = CONFIG.welcome;
  const firstName = String(userName ?? '').split(' ')[0];

  // Um cartão por grupo (lei), com o total de perguntas e de assuntos.
  const groups = useMemo(() => {
    const byGrupo = new Map();
    for (const topic of topics) {
      if (!byGrupo.has(topic.grupo.key)) byGrupo.set(topic.grupo.key, { info: topic.grupo, count: 0, topics: 0 });
      const group = byGrupo.get(topic.grupo.key);
      group.count += topic.questions.length;
      group.topics += 1;
    }
    return [...byGrupo.values()];
  }, [topics]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl animate-fade-up flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        {/* Saudação */}
        <div className="text-center">
          <Logo size={60} glow />
          {firstName && <p className="mt-5 text-sm font-medium text-accent">Olá, {firstName} 👋</p>}
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            <span className="bg-linear-to-r from-brand to-brand-2 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">
              {title}
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted">{subtitle}</p>
        </div>

        {/* Perguntas populares */}
        <section className="mt-9">
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">Perguntas populares</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <button
                key={card.question}
                type="button"
                onClick={() => onPick(card.question)}
                className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-line-strong"
              >
                <TopicBadge icon={card.icon} tone={card.tone} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    {card.title}
                    <ArrowUpRight
                      size={15}
                      className="text-muted opacity-0 transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-muted">{card.question}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Temas */}
        {groups.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">Explore por tema</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((group) => (
                <button
                  key={group.info.key}
                  type="button"
                  onClick={() => onOpenTopic(grupoKey(group.info.key))}
                  className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left transition hover:border-line-strong hover:bg-surface-2"
                >
                  <TopicBadge icon={group.info.icon} tone={group.info.tone} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-tight font-medium">{group.info.title}</span>
                    {group.info.description && (
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{group.info.description}</span>
                    )}
                    <span className="mt-1 block text-xs font-medium text-accent">
                      {group.count} perguntas em {group.topics} {group.topics === 1 ? 'assunto' : 'assuntos'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={onOpenHelp}
          className="mx-auto mt-8 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <CircleHelp size={16} aria-hidden="true" />
          Como funciona o assistente?
        </button>
      </div>
    </div>
  );
}
