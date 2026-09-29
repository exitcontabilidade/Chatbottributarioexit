'use client';

import { useLayoutEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

// Mesmo nome lido pelo script do <head> em app/layout.js.
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
    <div className={styles.toggle} role="radiogroup" aria-label="Tema">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          className={`${styles.option} ${theme === value ? styles.selected : ''}`}
          onClick={() => choose(value)}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
