// Respostas simuladas (CHATBOT_RESPOSTA=mock), para testar a tela.
//
// Não trazem conteúdo tributário de verdade: imitam os comportamentos previstos
// (resposta com fontes, pergunta fora do assunto, informação não encontrada, erro).
// Para outros cenários, acrescente regras em RULES (a primeira que casar vence).

import 'server-only';

const MAIN_SUGGESTIONS = ['O que você faz?', 'O que muda com o IBS e a CBS?', 'Como fica a transição?'];

const EXAMPLE_SOURCES = [
  {
    title: 'LC 214/2025',
    reference: 'trecho de exemplo',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
  },
  {
    title: 'EC 132/2023',
    reference: 'trecho de exemplo',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
  },
];

// `pattern` é aplicado no texto em minúsculas e sem acento.
const RULES = [
  { pattern: /simular erro/, error: true },
  {
    pattern: /\btcc\b|receita de|futebol|piada|ignore (as |todas as )?instruc/,
    reply:
      'Só consigo responder sobre a **Reforma Tributária** (IBS, CBS e Imposto Seletivo). ' +
      'Pode reformular a pergunta dentro desse assunto?',
    suggestions: MAIN_SUGGESTIONS,
  },
  {
    pattern: /calcul|quanto (eu )?(vou|vai) pagar/,
    reply:
      'Por enquanto **não faço cálculos**: posso explicar a regra que se aplica, ' +
      'mas o valor deve ser apurado pelo contador.',
    suggestions: ['Como fica a transição?'],
  },
  {
    pattern: /imposto de renda|\birpf\b|\birpj\b/,
    reply: 'Não encontrei essa informação na base de legislação consultada.',
    suggestions: MAIN_SUGGESTIONS,
  },
  {
    pattern: /o que voce faz|ajuda|menu|opcoes/,
    reply:
      'Estou em **modo de demonstração**: minhas respostas são simuladas pelo servidor.\n\n' +
      'Quando a IA estiver ligada, vou:\n' +
      '- responder dúvidas sobre **IBS, CBS e Imposto Seletivo** com base na legislação\n' +
      '- mostrar as **fontes** (norma e artigo) de cada resposta\n' +
      '- considerar a data de referência da pergunta (as regras mudam ano a ano)\n\n' +
      'Nesta fase não faço cálculos. Para testar, pergunte algo sobre IBS/CBS, peça um cálculo, ' +
      'fuja do assunto ou digite `simular erro`.',
    suggestions: ['O que muda com o IBS e a CBS?', 'Calcule meu imposto', 'simular erro'],
  },
  {
    pattern: /\b(ibs|cbs)\b|imposto seletivo|reforma|transicao|cashback|split payment|aliquota|lc 214|ec 132/,
    reply:
      '_(resposta simulada)_\n\n' +
      'Aqui entra a explicação montada pela IA a partir dos trechos da legislação encontrados ' +
      'na busca, citando de onde veio cada informação.\n\n' +
      'Data de referência considerada: **{hoje}**.',
    sources: EXAMPLE_SOURCES,
    suggestions: ['Como fica a transição?', 'Mostrar formatação'],
  },
  {
    pattern: /formatacao|markdown/,
    reply:
      'Consigo exibir **negrito**, *itálico* e `código`.\n\n' +
      'Listas:\n- item um\n- item dois\n\n' +
      'Passo a passo:\n1. primeiro\n2. segundo\n\n' +
      'E links: https://example.com',
    suggestions: MAIN_SUGGESTIONS,
  },
  { pattern: /obrigad|valeu/, reply: 'Por nada! Se precisar de mais alguma coisa, é só chamar. 👋' },
  {
    pattern: /\b(oi|ola|opa|bom dia|boa tarde|boa noite|e ai)\b/,
    reply: 'Olá! 😊 Qual é a sua dúvida sobre a Reforma Tributária?',
    suggestions: MAIN_SUGGESTIONS,
  },
];

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fallback({ message, history }) {
  const short = message.length > 80 ? `${message.slice(0, 80)}…` : message;
  return (
    `_(resposta simulada)_ Recebi: “${short}”.\n\n` +
    'Quando a IA estiver ligada, a resposta de verdade aparece aqui.\n\n' +
    `_(chegaram também ${history.length} mensagens anteriores como contexto)_`
  );
}

export class MockResponder {
  async reply(request) {
    await sleep(500 + Math.random() * 1000); // imita o tempo de resposta de uma IA

    const text = normalize(request.message);
    const rule = RULES.find((r) => r.pattern.test(text));
    if (rule?.error) throw new Error('Erro simulado pelo mock');
    if (rule) {
      const hoje = new Date().toLocaleDateString('pt-BR');
      return {
        reply: rule.reply.replace('{hoje}', hoje),
        sources: rule.sources ?? [],
        suggestions: rule.suggestions ?? [],
      };
    }
    return { reply: fallback(request), sources: [], suggestions: ['O que você faz?'] };
  }
}
