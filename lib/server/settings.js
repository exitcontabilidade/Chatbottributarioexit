// Configurações do servidor, lidas das variáveis de ambiente (.env.local).
// Segredos (chave da IA, senha do banco) ficam só aqui no servidor, nunca na tela.

import 'server-only';
import path from 'node:path';

const RESPOSTAS = ['faq', 'mock'];

export function getSettings() {
  // Quem gera as respostas:
  //   faq  = perguntas e respostas cadastradas no JSON (sem IA)
  //   mock = respostas simuladas, para testar a tela (fontes, erro etc.)
  // A IA entra aqui depois como outra opção.
  const resposta = process.env.CHATBOT_RESPOSTA || 'faq';
  if (!RESPOSTAS.includes(resposta)) {
    throw new Error(`CHATBOT_RESPOSTA inválido: "${resposta}" (use ${RESPOSTAS.join(' ou ')})`);
  }

  return {
    resposta,
    // Arquivo .json ou pasta: a pasta Perguntas/ é lida por inteiro (Perguntas.json + leis/*.json).
    perguntasPath: process.env.CHATBOT_PERGUNTAS_PATH || path.join(process.cwd(), 'Perguntas'),
  };
}
