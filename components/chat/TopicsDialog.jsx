'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Info, Layers, MessageSquarePlus, Search, SearchX } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import { cn } from '@/lib/cn';
import { renderMarkdown } from '@/lib/markdown';
import CopyButton from '@/components/ui/CopyButton';
import Dialog from '@/components/ui/Dialog';
import TopicBadge from '@/components/ui/TopicBadge';
import Sources from './Sources';

// Seleção: 'todos', um grupo (`g:<grupo>`, ex.: uma lei), um tema (`t:<tema>`, ex.: um título) ou
// um assunto (`m:<módulo>`).
export const ALL = 'todos';
export const grupoKey = (key) => `g:${key}`;
const temaKey = (key) => `t:${key}`;
const moduleKey = (key) => `m:${key}`;

const PAGE = 60; // perguntas mostradas por vez (a lista cresce com "Mostrar mais")
const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Assuntos organizados em grupo > tema > assunto, na ordem em que aparecem na base. */
function buildTree(topics) {
  const grupos = new Map();
  for (const topic of topics) {
    if (!grupos.has(topic.grupo.key)) grupos.set(topic.grupo.key, { info: topic.grupo, temas: new Map(), count: 0 });
    const grupo = grupos.get(topic.grupo.key);
    if (!grupo.temas.has(topic.tema.key)) grupo.temas.set(topic.tema.key, { info: topic.tema, topics: [], count: 0 });
    const tema = grupo.temas.get(topic.tema.key);
    tema.topics.push(topic);
    tema.count += topic.questions.length;
    grupo.count += topic.questions.length;
  }
  return [...grupos.values()].map((g) => ({ ...g, temas: [...g.temas.values()] }));
}

/**
 * Janela "Explorar temas": escolha uma lei, um título ou um assunto (ou busque) e abra uma pergunta
 * para ler a resposta. Dali dá para mandar a pergunta para o chat. Computador: lista à esquerda;
 * celular: faixa rolável no topo.
 */
export default function TopicsDialog({ topics, open, initialTopic, onClose, onPick }) {
  const [selected, setSelected] = useState(ALL);
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState(null); // pergunta aberta (uma por vez)
  const [limit, setLimit] = useState(PAGE);

  // Ao abrir: começa no que foi clicado (ou em "Todos"), com a busca limpa e tudo fechado.
  useEffect(() => {
    if (!open) return;
    setSelected(initialTopic ?? ALL);
    setQuery('');
    setOpenKey(null);
    setLimit(PAGE);
  }, [open, initialTopic]);

  const tree = useMemo(() => buildTree(topics), [topics]);
  const total = topics.reduce((sum, t) => sum + t.questions.length, 0);

  // Perguntas da seleção, filtradas pela busca (a busca olha todos os assuntos).
  const visible = useMemo(() => {
    const q = normalize(query.trim());
    const inSelection = (t) =>
      selected === ALL || selected === grupoKey(t.grupo.key) || selected === temaKey(t.tema.key) || selected === moduleKey(t.key);
    const pool = q ? topics : topics.filter(inSelection);
    return pool.flatMap((topic) =>
      topic.questions
        .map((item, i) => ({ item, topic, key: `${topic.key}:${i}` }))
        .filter(({ item }) => !q || normalize(item.question).includes(q)),
    );
  }, [topics, selected, query]);

  // O que está selecionado, para o cabeçalho da lista.
  const current = useMemo(() => {
    for (const grupo of tree) {
      if (selected === grupoKey(grupo.info.key)) return { ...grupo.info, count: grupo.count };
      for (const tema of grupo.temas) {
        if (selected === temaKey(tema.info.key)) return { ...tema.info, icon: grupo.info.icon, tone: grupo.info.tone, count: tema.count };
        for (const topic of tema.topics) {
          if (selected === moduleKey(topic.key)) return { ...topic, count: topic.questions.length };
        }
      }
    }
    return null;
  }, [tree, selected]);
  const singleTopic = selected.startsWith('m:');

  function choose(key) {
    setSelected(key);
    setQuery('');
    setOpenKey(null);
    setLimit(PAGE);
  }

  function ask(question) {
    onClose();
    onPick(question);
  }

  const chipClass = (active) =>
    cn(
      'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
      active ? 'bg-accent-soft font-medium text-accent' : 'text-fg-2 hover:bg-surface-2',
    );
  const headingClass = (active, extra) =>
    cn(
      'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[11px] font-semibold tracking-wider uppercase transition',
      active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2',
      extra,
    );
  const countBadge = (n) => (
    <span className="rounded-full bg-surface-2 px-1.5 py-px text-[10px] font-medium tracking-normal text-muted normal-case">{n}</span>
  );

  const shown = visible.slice(0, limit);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Explorar temas"
      description={`${total} perguntas em ${topics.length} assuntos. Toque numa pergunta para ver a resposta.`}
      className="sm:h-[min(85dvh,720px)] sm:max-w-4xl"
    >
      {/* Busca */}
      <div className="border-b border-line px-5 py-3 sm:px-6">
        <label className="relative block">
          <span className="sr-only">Buscar pergunta</span>
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE);
            }}
            placeholder="Buscar pergunta… (ex.: cashback, MEI, 2027)"
            className="h-11 w-full rounded-xl border border-line bg-bg pr-3 pl-10 text-base outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent-soft sm:text-sm"
          />
        </label>
      </div>

      {topics.length === 0 ? (
        <p className="flex-1 px-6 py-16 text-center text-sm text-danger">Não foi possível carregar os temas.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Leis, títulos e assuntos */}
          <nav
            aria-label="Temas"
            className="flex shrink-0 gap-3 overflow-x-auto border-b border-line px-4 py-2 sm:w-72 sm:flex-col sm:gap-1 sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-3"
          >
            <button type="button" onClick={() => choose(ALL)} className={chipClass(selected === ALL && !query)}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-2" aria-hidden="true">
                <Layers size={16} />
              </span>
              <span className="whitespace-nowrap sm:whitespace-normal">Todos os temas</span>
            </button>

            {tree.map((grupo) => (
              <div key={grupo.info.key} className="flex shrink-0 gap-1 sm:flex-col">
                <button
                  type="button"
                  onClick={() => choose(grupoKey(grupo.info.key))}
                  title={grupo.info.title}
                  className={headingClass(selected === grupoKey(grupo.info.key) && !query, 'sm:mt-3')}
                >
                  <span className="whitespace-nowrap">{grupo.info.short}</span>
                  {countBadge(grupo.count)}
                </button>

                {grupo.temas.map((tema) => (
                  <div key={tema.info.key} className="flex shrink-0 gap-1 sm:flex-col">
                    {/* Título dentro da lei (só aparece quando a lei tem mais de um) */}
                    {grupo.temas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => choose(temaKey(tema.info.key))}
                        title={tema.info.title}
                        className={cn(
                          'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1 text-left text-xs font-semibold transition sm:mt-1',
                          selected === temaKey(tema.info.key) && !query ? 'bg-accent-soft text-accent' : 'text-fg-2 hover:bg-surface-2',
                        )}
                      >
                        <span className="whitespace-nowrap sm:whitespace-normal">{tema.info.short}</span>
                        {countBadge(tema.count)}
                      </button>
                    )}
                    {tema.topics.map((topic) => (
                      <button
                        key={topic.key}
                        type="button"
                        onClick={() => choose(moduleKey(topic.key))}
                        className={chipClass(selected === moduleKey(topic.key) && !query)}
                      >
                        <TopicBadge icon={topic.icon} tone={topic.tone} size="sm" />
                        <span className="min-w-0 whitespace-nowrap sm:whitespace-normal">
                          <span className="block leading-tight">{topic.title}</span>
                          <span className="hidden text-xs text-muted sm:block">{topic.questions.length} perguntas</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          {/* Perguntas */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-4">
            {!query && current && (
              <div className="mb-2 flex items-center gap-3 px-2 py-2">
                <TopicBadge icon={current.icon} tone={current.tone} />
                <div>
                  <p className="font-semibold">{current.title}</p>
                  <p className="text-sm text-muted">
                    {current.description ? `${current.description} · ` : ''}
                    {current.count} perguntas
                  </p>
                </div>
              </div>
            )}

            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted">
                <SearchX size={28} aria-hidden="true" />
                Nenhuma pergunta encontrada. Tente outra palavra.
              </div>
            ) : (
              <>
                <ul className="space-y-1">
                  {shown.map(({ item, topic, key }) => (
                    <QuestionItem
                      key={key}
                      id={key}
                      item={item}
                      topicTitle={query.trim() || !singleTopic ? topic.title : ''}
                      open={openKey === key}
                      onToggle={() => setOpenKey((prev) => (prev === key ? null : key))}
                      onAsk={() => ask(item.question)}
                    />
                  ))}
                </ul>
                {visible.length > shown.length && (
                  <button
                    type="button"
                    onClick={() => setLimit((n) => n + PAGE)}
                    className="mx-auto mt-3 flex h-10 items-center rounded-full border border-line px-5 text-sm font-medium text-fg-2 transition hover:bg-surface-2"
                  >
                    Mostrar mais ({visible.length - shown.length} restantes)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

/** Uma pergunta que abre e fecha; aberta, mostra a resposta, as fontes e o botão de enviar ao chat. */
function QuestionItem({ id, item, topicTitle, open, onToggle, onAsk }) {
  const rootRef = useRef(null);
  const answerRef = useRef(null);
  const panelId = `resposta-${id.replace(/[^a-z0-9_-]/gi, '-')}`;
  // Resposta em Markdown; o renderMarkdown escapa todo o HTML antes de formatar.
  const html = useMemo(() => (open ? renderMarkdown(item.answer) : ''), [open, item.answer]);

  // Ao abrir uma pergunta no fim da lista, rola para a resposta não ficar escondida.
  useEffect(() => {
    if (open) rootRef.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  return (
    <li ref={rootRef} className={cn('rounded-xl border transition-colors', open ? 'border-line bg-surface-2/50' : 'border-transparent')}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2"
        >
          <span className="min-w-0 flex-1">
            <span className={cn('block text-sm leading-snug text-fg', open && 'font-semibold')}>{item.question}</span>
            {topicTitle && <span className="mt-0.5 block text-xs font-normal text-muted">{topicTitle}</span>}
          </span>
          <ChevronDown
            size={18}
            className={cn('mt-0.5 shrink-0 text-muted transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </h3>

      {open && (
        <div id={panelId} className="animate-fade-up px-3 pb-3">
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="px-4 py-3.5">
              <div ref={answerRef} className="markdown text-fg-2" dangerouslySetInnerHTML={{ __html: html }} />
              {item.sources.length > 0 && <Sources sources={item.sources} />}
            </div>
            <p className="flex items-start gap-2 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted">
              <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
              {CONFIG.disclaimer}
            </p>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onAsk}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-linear-to-br from-brand to-brand-2 px-4 text-[13px] font-medium text-white shadow-card transition hover:opacity-90"
            >
              <MessageSquarePlus size={15} aria-hidden="true" />
              Perguntar no chat
            </button>
            <CopyButton getText={() => answerRef.current?.innerText ?? item.answer} />
          </div>
        </div>
      )}
    </li>
  );
}
