'use client';

import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';

/**
 * Botão "Instalar app" do PWA. O app funciona normalmente no navegador; instalar é opcional.
 * - Chrome/Edge/Android: o navegador avisa quando dá para instalar (capturado no app/layout.jsx).
 * - iPhone/iPad: não existe esse aviso, então o botão abre um passo a passo.
 */
export default function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    setInstalled(matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
    setIsIOS(
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );

    const syncPrompt = () => setInstallPrompt(window.__installPrompt ?? null);
    const onInstalled = () => {
      window.__installPrompt = null;
      setInstallPrompt(null);
      setInstalled(true);
    };
    syncPrompt();
    window.addEventListener('installpromptready', syncPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('installpromptready', syncPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!installPrompt && !isIOS)) return null;

  async function install() {
    if (!installPrompt) {
      setShowSteps(true);
      return;
    }
    // Cada aviso só pode ser usado uma vez.
    window.__installPrompt = null;
    setInstallPrompt(null);
    installPrompt.prompt();
    await installPrompt.userChoice;
  }

  return (
    <>
      <button
        type="button"
        onClick={install}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent-soft text-sm font-medium text-accent transition hover:border-accent"
      >
        <Download size={16} aria-hidden="true" />
        Instalar app
      </button>

      {isIOS && (
        <Dialog
          open={showSteps}
          onClose={() => setShowSteps(false)}
          title="Instalar no iPhone"
          description="Leva só dois toques."
          className="sm:max-w-md"
        >
          <ol className="space-y-4 px-5 py-5 sm:px-6">
            <li className="flex gap-3">
              <Step n={1} />
              <p>
                Toque em <strong>Compartilhar</strong>{' '}
                <Share size={16} className="inline align-[-3px] text-accent" aria-hidden="true" /> na barra do Safari.
              </p>
            </li>
            <li className="flex gap-3">
              <Step n={2} />
              <p>
                Escolha <strong>Adicionar à Tela de Início</strong>.
              </p>
            </li>
          </ol>
        </Dialog>
      )}
    </>
  );
}

function Step({ n }) {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
      {n}
    </span>
  );
}
