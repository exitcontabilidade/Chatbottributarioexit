// Responde com as perguntas e respostas cadastradas em Perguntas/Perguntas.json (sem IA).
//
// Compara o texto digitado com as perguntas cadastradas (por cobertura das palavras, ver
// FaqIndex.search) e devolve a resposta da mais parecida. Se nenhuma for parecida o bastante, diz que não
// encontrou e sugere as mais próximas. A base pode ser um arquivo ou uma pasta (todos os .json
// dela são lidos); em desenvolvimento é relida sozinha quando um arquivo é salvo.
//
// Formato do JSON:
//   { "tema": { "modulo": [ { "id": 1, "pergunta": "...", "resposta": "...",
//                             "fontes": [ { "norma": "LC 214/2025", "referencia": "art. X", "url": "https://..." } ] } ] } }
// ("fontes" é opcional.)

import 'server-only';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Nota de semelhança (0 a 1) entre o texto digitado e a pergunta cadastrada:
const HIGH_SCORE = 0.62; // a partir daqui responde direto
const MIN_SCORE = 0.42; // entre MIN e HIGH responde avisando que é "a mais parecida"
const SUGGEST_SCORE = 0.28; // parecida o bastante para aparecer como sugestão
export const THRESHOLDS = { HIGH: HIGH_SCORE, MIN: MIN_SCORE, SUGGEST: SUGGEST_SCORE }; // usado por npm run avaliar

// Como a nota é calculada (ver FaqIndex.search):
const ANSWER_MATCH = 0.4; // palavra da consulta que só aparece na resposta vale 40% de uma que está na pergunta
const UNKNOWN_WEIGHT = 2; // peso de uma palavra da consulta que não existe em nenhuma pergunta ou resposta
const FOCUS_BASE = 0.5; // parte da nota que não depende de a pergunta ser "só sobre isso"
const INFO_MIN = 2.6; // "quantidade de informação" mínima das palavras achadas (palavra comum vale pouco)
const BIGRAM_BONUS = 0.08; // bônus por palavras da consulta que aparecem juntas, na mesma ordem, na pergunta
const LEAD_BONUS = 0.06; // bônus quando consulta e pergunta começam igual ("o que é…", "quando ocorre…")
const FIRST_BONUS = 0.05; // bônus quando o assunto é a primeira palavra útil dos dois ("O que é o IBS…")

const STEM_LEN = 5; // "tributos", "tributária", "tributação" -> "tribu"

const STOPWORDS = new Set(`
  a o as os um uma uns umas de da do das dos em no na nos nas num numa ao aos
  e ou que se com por para pra pelo pela pelos pelas sobre entre ate
  qual quais como sao ser esta estao este isso isto essa esse
  seu sua seus suas meu minha nosso nossa voce voces eu ele ela eles elas
  me te lhe vai vao ha tem ter fica ficam mais muito ja tambem so nao sim
  quem onde sera serao pode podem deve devem faz fazer cada todo toda todos todas caso ainda agora hoje
  paga pagam pagar pago pagamos quanto quantos quanta quantas funciona funcionam existe existem
  significa muda mudam mudar altera alteram
`.split(/\s+/).filter(Boolean));
// A segunda parte da lista são verbos genéricos de pergunta ("X paga IBS?", "como funciona X?"): dizem
// pouco sobre o assunto e, sendo raros nas perguntas cadastradas, atrapalhariam a busca.
// ("pagamento" continua valendo: a lista compara a palavra inteira, antes de cortá-la.)

// Palavras diferentes com o mesmo sentido na base (depois de cortadas em STEM_LEN letras).
const SYNONYMS = { acaba: 'extin', acabo: 'extin', termi: 'extin', alugu: 'locac' };

const GREETINGS = new Set(['oi', 'oie', 'ola', 'opa', 'bom', 'boa', 'dia', 'tarde', 'noite', 'tudo', 'bem', 'eai', 'ai']);
const THANKS = /^\W*(muito )?(obrigad|valeu|vlw|agradec)/;
const HELP =
  /^\W*(ajuda|menu|help|opcoes)\W*$|o que voce (faz|sabe|responde)|quais perguntas|o que (eu )?(posso|consigo) perguntar/;

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const words = (text) => normalize(text).match(/[a-z0-9]+/g) ?? [];

function tokens(text) {
  return words(text)
    .filter((w) => !STOPWORDS.has(w))
    .map((w) => {
      const stem = w.slice(0, STEM_LEN);
      return SYNONYMS[stem] ?? stem;
    });
}

/** Pares de palavras vizinhas, na ordem em que aparecem: [a, b, c] -> ['a b', 'b c']. */
function pairs(list) {
  return list.slice(1).map((t, i) => `${list[i]} ${t}`);
}

function sample(list, n) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

// "_meta" (opcional, em cada arquivo) dá nome, descrição, ícone e cor a grupos, temas e módulos:
//   { "_meta": { "grupos": { "lc214": { "title": "..." } },
//                "temas":  { "lc214_t1": { "title": "...", "short": "...", "grupo": "lc214" } },
//                "modulos": { "lc214_01_x": { "title": "...", "description": "...", "icon": "book", "tone": "blue" } } },
//     "lc214_t1": { "lc214_01_x": [ ...perguntas ] } }
function parseItems(data, items = [], meta = { grupos: {}, temas: {}, modulos: {} }) {
  for (const key of ['grupos', 'temas', 'modulos']) Object.assign(meta[key], data?._meta?.[key]);

  for (const [tema, modulos] of Object.entries(data ?? {})) {
    if (tema === '_meta') continue;
    for (const [modulo, perguntas] of Object.entries(modulos ?? {})) {
      for (const p of perguntas) {
        if (typeof p?.pergunta !== 'string' || typeof p?.resposta !== 'string') {
          throw new Error(`Pergunta sem "pergunta" ou "resposta" em "${modulo}" (id ${p?.id})`);
        }
        const fontes = (Array.isArray(p.fontes) ? p.fontes : [])
          .filter((f) => typeof f?.norma === 'string')
          .map((f) => ({
            title: f.norma,
            reference: typeof f.referencia === 'string' ? f.referencia : '',
            url: safeUrl(f.url),
          }));
        items.push({ id: p.id, pergunta: p.pergunta, resposta: p.resposta, tema, modulo, fontes });
      }
    }
  }
  return items;
}

class FaqIndex {
  constructor(items) {
    this.items = items;

    // Por pergunta: as palavras da pergunta (em ordem e como conjunto) e as da resposta.
    this.docs = items.map((item) => {
      const sequence = tokens(item.pergunta);
      return {
        question: new Set(sequence),
        first: sequence[0],
        pairs: new Set(pairs(sequence)),
        answer: new Set(tokens(item.resposta)),
        lead: words(item.pergunta).slice(0, 3).join(' '),
      };
    });

    // Palavra rara pesa mais que palavra comum (idf): "cashback" diz mais que "imposto".
    const df = new Map();
    for (const { question, answer } of this.docs) {
      for (const t of new Set([...question, ...answer])) df.set(t, (df.get(t) ?? 0) + 1);
    }
    this.idf = new Map([...df].map(([t, d]) => [t, Math.log((items.length + 1) / (d + 1)) + 1]));

    this.exact = new Map(items.map((item, i) => [words(item.pergunta).join(' '), i]));
  }

  /**
   * [{ score, item }] de todas as perguntas, da mais parecida para a menos.
   *
   * A nota (0 a 1) responde "quanto da consulta esta pergunta cobre?", e não "quão parecidos são
   * os dois textos": uma pergunta longa não perde nota só por ter palavras a mais.
   *   cobertura  = peso das palavras da consulta achadas (na pergunta valem 100%, só na resposta 40%)
   *                dividido pelo peso de todas as palavras da consulta
   *   foco       = quanto da pergunta é sobre a consulta (entre duas que cobrem tudo, a mais curta ganha)
   *   informação = palavras muito comuns sozinhas ("imposto") não bastam para responder
   */
  search(text) {
    const sequence = tokens(text);
    const query = [...new Set(sequence)];
    const known = query.filter((t) => this.idf.has(t));
    const total = known.reduce((sum, t) => sum + this.idf.get(t), 0) + (query.length - known.length) * UNKNOWN_WEIGHT;
    const queryPairs = [...new Set(pairs(sequence))];
    const lead = words(text).slice(0, 3).join(' ');

    const scores = this.docs.map((doc) => {
      let found = 0; // peso das palavras achadas (pergunta = 100%, resposta = 40%)
      let inQuestion = 0; // quantas palavras da consulta estão na pergunta
      for (const t of known) {
        const weight = this.idf.get(t);
        if (doc.question.has(t)) {
          found += weight;
          inQuestion += 1;
        } else if (doc.answer.has(t)) {
          found += weight * ANSWER_MATCH;
        }
      }
      if (!found) return 0;

      const coverage = found / total;
      const focus = doc.question.size ? inQuestion / doc.question.size : 0;
      const information = Math.min(1, found / INFO_MIN);
      const together = queryPairs.length ? queryPairs.filter((p) => doc.pairs.has(p)).length / queryPairs.length : 0;

      const bonus =
        (BIGRAM_BONUS * together + (lead === doc.lead ? LEAD_BONUS : 0) + (sequence[0] === doc.first ? FIRST_BONUS : 0)) * coverage;
      return Math.min(1, coverage * (FOCUS_BASE + (1 - FOCUS_BASE) * focus) * information + bonus);
    });

    // Texto idêntico a uma pergunta cadastrada (ex.: clicou numa sugestão).
    const exact = this.exact.get(words(text).join(' '));
    if (exact !== undefined) scores[exact] = 1;

    return scores.map((score, i) => ({ score, item: this.items[i] })).sort((a, b) => b.score - a.score);
  }

  /** Uma pergunta de cada um de `n` módulos sorteados. */
  examples(n = 3) {
    const byModule = new Map();
    for (const item of this.items) {
      if (!byModule.has(item.modulo)) byModule.set(item.modulo, []);
      byModule.get(item.modulo).push(item);
    }
    return sample([...byModule.values()], n).map((items) => sample(items, 1)[0].pergunta);
  }

  neighbors(item, n = 2) {
    const same = this.items.filter((i) => i.modulo === item.modulo && i.id !== item.id);
    return sample(same, n).map((i) => i.pergunta);
  }
}

// Arquivo .json ou pasta com vários .json (a pasta é lida por inteiro, em ordem alfabética).
async function listFiles(target) {
  if (!(await stat(target)).isDirectory()) return [target];
  const entries = await readdir(target, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => path.join(e.parentPath, e.name))
    .sort();
}

// Índice em memória por arquivo/pasta. Em desenvolvimento é refeito sozinho quando um arquivo é
// salvo; em produção os arquivos não mudam, então o índice é montado uma vez só.
const WATCH = process.env.NODE_ENV !== 'production';
const cache = new Map(); // caminho -> { signature, index }

async function loadIndex(target) {
  const cached = cache.get(target);
  if (cached && !WATCH) return cached.index;

  const files = await listFiles(target);
  const signature = (await Promise.all(files.map(async (f) => `${f}:${(await stat(f)).mtimeMs}`))).join('|');
  if (cached?.signature === signature) return cached.index;

  try {
    const items = [];
    const meta = { grupos: {}, temas: {}, modulos: {} };
    for (const file of files) {
      const text = (await readFile(file, 'utf8')).trimStart(); // trimStart também tira o BOM do Bloco de Notas
      try {
        parseItems(JSON.parse(text), items, meta);
      } catch (err) {
        throw new Error(`${path.basename(file)}: ${err.message}`);
      }
    }
    if (!items.length) throw new Error('Nenhuma pergunta encontrada');
    const index = new FaqIndex(items);
    index.meta = meta;
    cache.set(target, { signature, index });
    console.info(`Perguntas carregadas: ${index.items.length} (${files.length} arquivo(s))`);
    return index;
  } catch (err) {
    if (!cached) throw err;
    console.error(`Erro ao reler ${target}; mantendo a versão anterior.`, err);
    cache.set(target, { signature, index: cached.index });
    return cached.index;
  }
}

/**
 * Módulos da base, na ordem em que aparecem, com as perguntas de cada um (tela "Explorar temas").
 * `tema` agrupa módulos (ex.: um título da lei). Cada pergunta: { question, answer, sources } — a
 * tela mostra a resposta ao expandir. `meta` traz os nomes vindos do "_meta" dos arquivos.
 */
export async function getTopics(filePath) {
  const index = await loadIndex(filePath);
  const topics = new Map();
  for (const item of index.items) {
    if (!topics.has(item.modulo)) topics.set(item.modulo, { key: item.modulo, tema: item.tema, questions: [] });
    topics.get(item.modulo).questions.push({ question: item.pergunta, answer: item.resposta, sources: item.fontes });
  }
  return { topics: [...topics.values()], meta: index.meta };
}

/** As `n` perguntas mais parecidas com o texto, com a nota de semelhança (para conferir duplicatas). */
export async function searchQuestions(filePath, text, n = 5) {
  const index = await loadIndex(filePath);
  return index.search(text).slice(0, n).map(({ score, item }) => ({ score, id: item.id, pergunta: item.pergunta }));
}

export class FaqResponder {
  constructor(filePath) {
    this.path = filePath;
  }

  async reply({ message }) {
    const index = await loadIndex(this.path);
    const text = normalize(message);
    const content = tokens(message).filter((t) => !GREETINGS.has(t));

    if (THANKS.test(text)) {
      return answer('Por nada! Se tiver outra dúvida, é só perguntar. 👋');
    }
    if (HELP.test(text)) {
      return answer(
        `Tenho **${index.items.length} perguntas** sobre a Reforma Tributária cadastradas. ` +
          'Escreva sua dúvida com as suas palavras ou escolha um exemplo:',
        { suggestions: index.examples() },
      );
    }
    if (!content.length) {
      return answer('Olá! 😊 Qual é a sua dúvida sobre a Reforma Tributária?', { suggestions: index.examples() });
    }

    const results = index.search(message);
    const { score: bestScore, item: best } = results[0];

    if (bestScore >= MIN_SCORE) {
      const related = results.slice(1, 4).filter((r) => r.score >= SUGGEST_SCORE).map((r) => r.item.pergunta);
      return answer(best.resposta, {
        title: best.pergunta, // a tela mostra qual pergunta da base está sendo respondida
        note: bestScore >= HIGH_SCORE ? '' : 'Esta é a pergunta mais parecida que encontrei.',
        sources: best.fontes,
        suggestions: related.length ? related : index.neighbors(best),
      });
    }

    const close = results.slice(0, 3).filter((r) => r.score >= SUGGEST_SCORE).map((r) => r.item.pergunta);
    if (close.length) {
      return answer('Não encontrei essa pergunta na minha base. Alguma destas é o que você procura?', {
        suggestions: close,
      });
    }
    return answer(
      'Não encontrei essa pergunta na minha base. Tente escrever de outro jeito ou veja exemplos do que sei responder:',
      { suggestions: index.examples() },
    );
  }
}

function answer(reply, { title = '', note = '', sources = [], suggestions = [] } = {}) {
  return { reply, title, note, sources, suggestions };
}
