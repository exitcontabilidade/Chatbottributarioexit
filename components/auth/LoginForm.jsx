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
import { cn } from '@/lib/cn';
import { CONFIG } from '@/lib/config';
import Logo from '@/components/ui/Logo';

const FEATURES = [
  { Icon: BookOpen, title: 'Base de perguntas', text: 'Respostas organizadas por tema, com as fontes quando houver' },
  { Icon: CalendarClock, title: 'Transição 2026–2033', text: 'O que muda em cada ano da reforma' },
  { Icon: Smartphone, title: 'Em qualquer tela', text: 'Use no computador ou instale no celular' },
];

// Mensagem para cada resposta de POST /api/auth/login.
function loginError(status, detail) {
  if (status === 401) return detail || 'Usuário ou senha incorretos.';
  if (status === 400) return detail || 'Informe o usuário e a senha.';
  return 'Não foi possível entrar agora. Tente novamente em instantes.';
}

const inputClass = cn(
  'h-12 w-full rounded-xl border border-line bg-surface pl-11 text-base text-fg outline-none transition',
  'placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent-soft',
  'aria-invalid:border-danger aria-invalid:focus:ring-danger-soft',
  // preenchimento automático do navegador sem o fundo amarelo/azul
  '[&:-webkit-autofill]:[-webkit-text-fill-color:var(--ui-text)] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--ui-surface)]',
);

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
    <div className="grid h-dvh bg-bg lg:grid-cols-[minmax(420px,5fr)_6fr]">
      {/* ---------- Painel de apresentação (computador) ---------- */}
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand via-[#3f4fe4] to-brand-2 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-indigo-950/40 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <Logo size={42} className="ring-1 ring-white/40" />
          <div>
            <p className="font-semibold leading-tight">{CONFIG.botName}</p>
            <p className="text-sm text-white/70">{CONFIG.tagline}</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight text-balance">
            Suas dúvidas sobre a Reforma Tributária, respondidas na hora.
          </h2>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="text-sm text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">IBS · CBS · Imposto Seletivo</p>
      </aside>

      {/* ---------- Formulário ---------- */}
      <main className="relative flex overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top)+32px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
        {/* Fundo colorido suave (só no celular/tablet) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-brand/15 to-transparent lg:hidden" aria-hidden="true" />

        <div className="relative m-auto w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={44} glow />
            <div>
              <p className="font-semibold leading-tight">{CONFIG.botName}</p>
              <p className="text-sm text-muted">{CONFIG.tagline}</p>
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1.5 mb-8 text-muted">Acesse com seu usuário e senha.</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-fg-2">
                Usuário
              </label>
              <div className="relative">
                <UserRound size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                  placeholder="Seu usuário"
                  aria-invalid={Boolean(error) || undefined}
                  className={cn(inputClass, 'pr-4')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-fg-2">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Sua senha"
                  aria-invalid={Boolean(error) || undefined}
                  onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  onBlur={() => setCapsLock(false)}
                  className={cn(inputClass, 'pr-12')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {capsLock && <p className="mt-1.5 text-xs text-warning">Caps Lock está ativado.</p>}
            </div>

            {error && (
              <p role="alert" className="flex animate-fade-up items-center gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                <CircleAlert size={18} className="shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand to-brand-2 font-semibold text-white shadow-card transition hover:brightness-110 active:scale-[0.99] disabled:opacity-75"
            >
              {pending ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted">
            <FlaskConical size={14} aria-hidden="true" />
            Ambiente de demonstração
          </p>
        </div>
      </main>
    </div>
  );
}
