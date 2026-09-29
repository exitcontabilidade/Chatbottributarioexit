'use client';

import { useLayoutEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';

// Mesmo nome lido pelo script do <head> em app/layout.jsx.
const KEY = 'chatbot:tema';

const OPTIONS = [
  { value: 'system', label: 'Sistema', Icon: Monitor },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Escuro', Icon: Moon },
];

function readTheme() {
  try {
    const theme = localStorage.getItem(KEY);
    return theme === 'light' || theme === 'dark' ? theme : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme) {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

/** Escolha do tema: Sistema / Claro / Escuro. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState('system');

  // Lê o tema salvo e reaplica (em desenvolvimento o React limpa o atributo do <html> ao remontar).
  useLayoutEffect(() => {
    const saved = readTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function choose(value) {
    setTheme(value);
    applyTheme(value);
    try {
      if (value === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, value);
    } catch {
      // storage bloqueado: vale só até recarregar
    }
  }

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-0.5 rounded-xl bg-surface-3 p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => choose(value)}
          className={cn(
            'flex h-8 items-center justify-center gap-1.5 rounded-[10px] text-xs font-medium transition',
            theme === value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          <Icon size={14} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
