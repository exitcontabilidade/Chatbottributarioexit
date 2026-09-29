import {
  BookOpen,
  Briefcase,
  CalendarClock,
  Factory,
  HandCoins,
  Landmark,
  Sparkles,
  Split,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// Nomes usados em lib/topics.js e lib/config.js (`icon` e `tone`).
const ICONS = {
  book: BookOpen,
  calendar: CalendarClock,
  factory: Factory,
  store: Store,
  split: Split,
  landmark: Landmark,
  briefcase: Briefcase,
  cashback: HandCoins,
  sparkles: Sparkles,
};

// Classes escritas por extenso para o Tailwind encontrá-las.
const TONES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

/** Quadradinho colorido com o ícone de um tema. */
export default function TopicBadge({ icon, tone = 'blue', size = 'md', className }) {
  const Icon = ICONS[icon] ?? Sparkles;
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center',
        size === 'sm' ? 'size-8 rounded-lg' : 'size-10 rounded-xl',
        TONES[tone] ?? TONES.blue,
        className,
      )}
      aria-hidden="true"
    >
      <Icon size={size === 'sm' ? 16 : 19} />
    </span>
  );
}
