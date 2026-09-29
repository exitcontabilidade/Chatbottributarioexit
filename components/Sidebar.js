'use client';

import { useMemo } from 'react';
import { SquarePen, Trash2, X } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import InstallButton from './InstallButton';
import ThemeToggle from './ThemeToggle';
import styles from './Sidebar.module.css';

const DAY = 24 * 60 * 60 * 1000;

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

export default function Sidebar({ open, onClose, conversations, activeId, onSelect, onNew, onDelete, online }) {
  const groups = useMemo(() => groupByDate(conversations), [conversations]);

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`} onClick={onClose} aria-hidden="true" />

      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} aria-label="Conversas">
        <div className={styles.head}>
          <div className={styles.brand}>
            <img src="/icons/icon.svg" alt="" width={32} height={32} />
            <div className={styles.brandText}>
              <p className={styles.brandName}>{CONFIG.botName}</p>
              <p className={styles.brandTag}>{CONFIG.tagline}</p>
            </div>
          </div>
          <button className={styles.closeBtn} type="button" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <button className={styles.newBtn} type="button" onClick={onNew}>
          <SquarePen size={17} />
          Nova conversa
        </button>

        <nav className={styles.list} aria-label="Histórico de conversas">
          {groups.length === 0 ? (
            <p className={styles.empty}>Suas conversas aparecem aqui.</p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className={styles.group}>
                <h2 className={styles.groupLabel}>{group.label}</h2>
                <ul>
                  {group.items.map((conv) => {
                    const isActive = conv.id === activeId;
                    const title = conv.title || 'Conversa sem título';
                    return (
                      <li key={conv.id} className={`${styles.item} ${isActive ? styles.active : ''}`}>
                        <button
                          className={styles.itemBtn}
                          type="button"
                          title={title}
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => onSelect(conv.id)}
                        >
                          {title}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          type="button"
                          aria-label={`Apagar a conversa "${title}"`}
                          title="Apagar"
                          onClick={() => onDelete(conv)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </nav>

        <div className={styles.foot}>
          <InstallButton />
          <ThemeToggle />
          <p className={styles.status}>
            <span className={`${styles.dot} ${online ? '' : styles.offline}`} />
            {online ? 'Online' : 'Sem conexão'}
          </p>
        </div>
      </aside>
    </>
  );
}
