'use client';

import { CalendarClock, HandCoins, Sparkles, Split, Store } from 'lucide-react';
import { CONFIG } from '@/lib/config';
import styles from './Welcome.module.css';

// Nomes usados em CONFIG.welcome.cards[].icon
const ICONS = { calendar: CalendarClock, store: Store, split: Split, cashback: HandCoins };

export default function Welcome({ onPick }) {
  const { title, subtitle, cards } = CONFIG.welcome;

  return (
    <div className={styles.welcome}>
      <div className={styles.inner}>
        <img className={styles.logo} src="/icons/icon.svg" alt="" width={56} height={56} />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.grid}>
          {cards.map((card) => {
            const Icon = ICONS[card.icon] ?? Sparkles;
            return (
              <button key={card.question} type="button" className={styles.card} onClick={() => onPick(card.question)}>
                <span className={styles.cardIcon}>
                  <Icon size={18} />
                </span>
                <span className={styles.cardTitle}>{card.title}</span>
                <span className={styles.cardText}>{card.question}</span>
              </button>
            );
          })}
        </div>

        <button type="button" className={styles.more} onClick={() => onPick('O que você sabe responder?')}>
          Ver o que eu sei responder
        </button>
      </div>
    </div>
  );
}
