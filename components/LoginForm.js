'use client';

import { useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CircleAlert,
  Eye,
  EyeOff,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { CONFIG } from '@/lib/config';
import styles from './LoginForm.module.css';

const FEATURES = [
  { Icon: BookOpen, text: 'Respostas com base na legislação, com as fontes citadas' },
  { Icon: CalendarClock, text: 'Regras da transição de 2026 a 2033' },
  { Icon: Smartphone, text: 'Use no computador ou instale no celular' },
];

// Mensagem para cada resposta de POST /api/auth/login.
function loginError(status, detail) {
  if (status === 401) return detail || 'Usuário ou senha incorretos.';
  if (status === 400) return detail || 'Informe o usuário e a senha.';
  return 'Não foi possível entrar agora. Tente novamente em instantes.';
}

export default function LoginForm() {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const passwordRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (!username || !password) {
      setError('Informe o usuário e a senha.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.assign('/'); // recarrega já com o cookie de sessão
        return;
      }
      const data = await res.json().catch(() => null);
      setError(loginError(res.status, data?.detail));
      if (res.status === 401 && passwordRef.current) {
        passwordRef.current.value = '';
        passwordRef.current.focus();
      }
    } catch {
      setError('Sem conexão com o servidor. Verifique sua rede e tente novamente.');
    }
    setPending(false);
  }

  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div className={styles.heroBrand}>
          <img src="/icons/icon.svg" alt="" width={40} height={40} />
          <span>{CONFIG.botName}</span>
        </div>

        <div>
          <p className={styles.headline}>Suas dúvidas sobre a Reforma Tributária, respondidas na hora.</p>
          <ul className={styles.features}>
            {FEATURES.map(({ Icon, text }) => (
              <li key={text}>
                <span className={styles.featureIcon}>
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.heroFoot}>IBS · CBS · Imposto Seletivo</p>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.mobileBrand}>
            <img src="/icons/icon.svg" alt="" width={40} height={40} />
            <div>
              <p className={styles.mobileName}>{CONFIG.botName}</p>
              <p className={styles.mobileTag}>{CONFIG.tagline}</p>
            </div>
          </div>

          <h1 className={styles.title}>Entrar</h1>
          <p className={styles.subtitle}>Acesse com seu usuário e senha.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">
                Usuário
              </label>
              <div className={styles.control}>
                <UserRound size={18} className={styles.leadingIcon} />
                <input
                  id="username"
                  name="username"
                  className={styles.input}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                  aria-invalid={Boolean(error)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Senha
              </label>
              <div className={styles.control}>
                <LockKeyhole size={18} className={styles.leadingIcon} />
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${styles.input} ${styles.withToggle}`}
                  autoComplete="current-password"
                  required
                  aria-invalid={Boolean(error)}
                  onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  onBlur={() => setCapsLock(false)}
                />
                <button
                  type="button"
                  className={styles.toggle}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {capsLock && <p className={styles.caps}>Caps Lock está ativado.</p>}
            </div>

            {error && (
              <p className={styles.error} role="alert">
                <CircleAlert size={18} />
                {error}
              </p>
            )}

            <button type="submit" className={styles.submit} disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle size={18} className={styles.spin} />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className={styles.note}>
            <FlaskConical size={14} />
            Ambiente de demonstração
          </p>
        </div>
      </main>
    </div>
  );
}
