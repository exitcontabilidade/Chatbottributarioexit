// Nome, descrição, ícone e cor de cada grupo (lei), tema (título da lei) e módulo (assunto) da base.
// As chaves do JSON não têm acento; esta tabela dá o nome bonito.
//
// Hierarquia:  grupo (ex.: uma lei)  >  tema (ex.: um título)  >  módulo (ex.: um capítulo)
//
// Quem NÃO está aqui pode trazer o nome no próprio arquivo de perguntas, no bloco "_meta" (é o que
// fazem os arquivos de Perguntas/leis/). O "_meta" vale mais que esta tabela. Sem nome em lugar
// nenhum, aparece um nome gerado a partir da chave.
// `icon` e `tone` (cor) são nomes dos mapas em components/ui/TopicBadge.jsx.

/** Grupos: o nível mais alto (cartões da tela inicial). */
export const GRUPO_INFO = {
  geral: {
    title: 'Perguntas gerais',
    short: 'Geral',
    description: 'A reforma explicada em perguntas e respostas, por assunto',
    icon: 'sparkles',
    tone: 'cyan',
  },
  ec132: {
    title: 'Emenda Constitucional 132/2023',
    short: 'EC 132',
    description: 'Constituição: IBS, CBS, Imposto Seletivo, Comitê Gestor e a transição',
    icon: 'landmark',
    tone: 'violet',
  },
  lc214: {
    title: 'Lei Complementar 214/2025',
    short: 'LC 214',
    description: 'A lei que regulamenta o IBS, a CBS e o Imposto Seletivo',
    icon: 'book',
    tone: 'blue',
  },
  lc227: {
    title: 'Lei Complementar 227/2026',
    short: 'LC 227',
    description: 'Comitê Gestor do IBS, processo administrativo, ITCMD e ajustes na LC 214',
    icon: 'briefcase',
    tone: 'emerald',
  },
};

/** Temas: o primeiro nível do JSON. `grupo` diz em que grupo aparece (padrão: o próprio tema). */
export const TEMA_INFO = {
  reforma_tributaria: { title: 'Perguntas gerais', short: 'Geral', grupo: 'geral' },
  ec132_2023: { title: 'Emenda Constitucional 132/2023', short: 'EC 132', grupo: 'ec132' },
};

/** Módulos: o segundo nível do JSON (só os das perguntas gerais; os das leis estão no "_meta"). */
export const TOPIC_INFO = {
  modulo_1_visao_geral_e_conceitos: {
    title: 'Visão geral e conceitos',
    description: 'IVA Dual, CBS, IBS, Imposto Seletivo e os princípios da reforma',
    icon: 'book',
    tone: 'blue',
  },
  modulo_2_cronograma_prazos_e_transicao: {
    title: 'Cronograma e transição',
    description: 'O que muda em cada ano, de 2026 a 2033',
    icon: 'calendar',
    tone: 'amber',
  },
  modulo_3_impacto_nos_setores_economicos: {
    title: 'Impacto nos setores',
    description: 'Serviços, indústria, saúde, educação, agro, imóveis e outros',
    icon: 'factory',
    tone: 'emerald',
  },
  modulo_4_simples_nacional_e_mei: {
    title: 'Simples Nacional e MEI',
    description: 'Opção híbrida, créditos e o que muda para pequenas empresas',
    icon: 'store',
    tone: 'violet',
  },
  modulo_5_mecanismos_especiais_e_operacao: {
    title: 'Split Payment, Cashback e IS',
    description: 'Mecanismos especiais e o dia a dia da operação',
    icon: 'split',
    tone: 'cyan',
  },
  modulo_6_regimes_especiais_imunidades_e_patrimonio: {
    title: 'Regimes especiais e patrimônio',
    description: 'Zona Franca, imunidades, IPVA, ITCMD e IPTU',
    icon: 'landmark',
    tone: 'rose',
  },
  modulo_7_gestao_empresarial_ti_precos_e_planejamento: {
    title: 'Gestão, TI e preços',
    description: 'Formação de preço, sistemas, contratos e planejamento',
    icon: 'briefcase',
    tone: 'orange',
  },
};

/** "novo_tema" -> "Novo tema" */
function humanize(key) {
  const text = key.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "modulo_8_novo_tema" ou "lc214_04_novo" -> "Novo tema" / "Novo" */
function titleFromKey(key) {
  return humanize(key.replace(/^(?:modulo|[a-z]+\d+)_\d+_/, ''));
}

const DEFAULT = { description: '', icon: 'sparkles', tone: 'blue' };

/** Módulo: { title, description, icon, tone }. `meta` = "_meta.modulos" dos arquivos. */
export function topicInfo(key, meta = {}) {
  return { ...DEFAULT, title: titleFromKey(key), ...TOPIC_INFO[key], ...meta[key] };
}

/** Grupo: { key, title, short, description, icon, tone }. */
export function grupoInfo(key, meta = {}) {
  return { ...DEFAULT, key, title: humanize(key), short: key, ...GRUPO_INFO[key], ...meta[key] };
}

/** Tema: { key, title, short, grupo (chave), description }. Sem `grupo`, o tema é o próprio grupo. */
export function temaInfo(key, meta = {}) {
  const info = { ...DEFAULT, key, title: humanize(key), short: key, ...TEMA_INFO[key], ...meta[key] };
  return { ...info, grupo: info.grupo ?? key };
}
