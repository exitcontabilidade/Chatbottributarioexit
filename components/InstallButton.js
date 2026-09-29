'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Share } from 'lucide-react';
import styles from './InstallButton.module.css';

// Botão "Instalar app" do PWA. O app funciona normalmente no navegador; instalar é opcional.
// - Chrome/Edge/Android: o navegador avisa quando dá para instalar (capturado no app/layout.js).
// - iPhone/iPad: não existe esse aviso, então o botão abre um passo a passo.
export default function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const dialogRef = useRef(null);

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
    if (installPrompt) {
      // Cada aviso só pode ser usado uma vez.
      window.__installPrompt = null;
      setInstallPrompt(null);
      installPrompt.prompt();
      await installPrompt.userChoice;
    } else {
      dialogRef.current?.showModal();
    }
  }

  return (
    <>
      <button className={styles.install} type="button" onClick={install}>
        <Download size={16} />
        Instalar app
      </button>

      {isIOS && (
        <dialog className={styles.sheet} ref={dialogRef}>
          <h2>Instalar o app</h2>
          <ol>
            <li>
              Toque em <strong>Compartilhar</strong> <Share size={16} className={styles.inlineIcon} /> na barra do
              Safari.
            </li>
            <li>
              Escolha <strong>Adicionar à Tela de Início</strong>.
            </li>
          </ol>
          <form method="dialog">
            <button className={styles.primary} type="submit">
              Entendi
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
