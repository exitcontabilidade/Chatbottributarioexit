import { BookOpen, ExternalLink } from 'lucide-react';

/** Fontes de uma resposta, em etiquetas (viram link quando a fonte tem endereço). */
export default function Sources({ sources }) {
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
        <BookOpen size={13} aria-hidden="true" />
        Fontes
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => {
          const label = source.reference ? `${source.title}, ${source.reference}` : source.title;
          const isLink = typeof source.url === 'string' && /^https?:\/\//i.test(source.url);
          const className =
            'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[13px] text-fg-2';
          return isLink ? (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${className} transition hover:border-accent hover:text-accent`}
            >
              {label}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : (
            <span key={i} className={className}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
