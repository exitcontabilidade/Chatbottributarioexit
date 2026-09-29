import { Inter } from 'next/font/google';
import ServiceWorker from '@/components/ServiceWorker';
import { CONFIG } from '@/lib/config';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  title: CONFIG.botName,
  description: CONFIG.description,
  icons: {
    icon: { url: '/icons/icon.svg', type: 'image/svg+xml' },
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { title: CONFIG.shortName, statusBarStyle: 'default' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content', // no Android, o teclado encolhe a tela em vez de cobrir o campo
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111317' },
  ],
};

// Roda antes da primeira pintura da tela:
// - aplica o tema escolhido (claro/escuro), para não piscar no tema errado;
// - guarda o aviso de instalação do PWA, que pode chegar antes do React carregar.
const EARLY_SCRIPT = `(function(){
try{var t=localStorage.getItem('chatbot:tema');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e;window.dispatchEvent(new Event('installpromptready'))});
})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_SCRIPT }} />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
