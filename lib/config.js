// Configurações da tela. Este arquivo vai para o navegador: nada secreto aqui.

export const CONFIG = {
  botName: 'Assistente Tributário',
  shortName: 'Tributário',
  tagline: 'Reforma Tributária',
  description: 'Dúvidas sobre a Reforma Tributária (IBS, CBS e Imposto Seletivo)',

  requestTimeoutMs: 30_000,
  // Quantas mensagens anteriores vão junto em cada pergunta, como contexto.
  historyLimit: 20,
  // O que fica salvo no navegador.
  maxStoredConversations: 50,
  maxStoredMessages: 200,

  // Aviso fixo exibido abaixo de toda resposta do bot.
  disclaimer: 'Informação baseada na legislação; não substitui a análise do contador.',

  // Tela inicial (conversa vazia). As perguntas existem em Perguntas/Perguntas.json.
  // `icon` é o nome de um ícone do components/Welcome.js.
  welcome: {
    title: 'Como posso ajudar?',
    subtitle:
      'Tire dúvidas sobre IBS, CBS, Imposto Seletivo, transição, Simples Nacional, Split Payment e mais.',
    cards: [
      {
        icon: 'calendar',
        title: 'Transição',
        question: 'Qual é a linha do tempo completa da transição da Reforma Tributária (2026 a 2033)?',
      },
      {
        icon: 'store',
        title: 'Simples Nacional',
        question: 'O Simples Nacional será extinto com a Reforma Tributária?',
      },
      {
        icon: 'split',
        title: 'Split Payment',
        question: 'O que é o sistema de Split Payment na Reforma Tributária?',
      },
      {
        icon: 'cashback',
        title: 'Cashback',
        question: 'O que é o mecanismo de Cashback tributário?',
      },
    ],
  },
};

// Limites de tamanho, conferidos na tela e de novo no servidor.
export const LIMITS = {
  messageChars: 4000,
  historyItems: 50,
  historyItemChars: 16000,
};
