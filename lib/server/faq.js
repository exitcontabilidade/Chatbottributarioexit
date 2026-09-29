// Responde com as perguntas e respostas cadastradas em Perguntas/Perguntas.json (sem IA).
//
// Compara o texto digitado com as perguntas cadastradas (TF-IDF sobre as palavras) e
// devolve a resposta da mais parecida. Se nenhuma for parecida o bastante, diz que não
// encontrou e sugere as mais próximas. O arquivo é relido sozinho quando é salvo.
//
// Formato do JSON:
//   { "tema": { "modulo": [ { "id": 1, "pergunta": "...", "resposta": "...",
//                             "fontes": [ { "norma": "LC 214/2025", "referencia": "art. X", "url": "https://..." } ] } ] } }
// ("fontes" é opcional.)

import 'server-only';
import { readFile, stat } from 'node:fs/promises';

// Nota de semelhança (0 a 1) entre o texto digitado e a pergunta cadastrada:
const HIGH_SCORE = 0.5; // a partir daqui responde direto
const MIN_SCORE = 0.35; // entre MIN e HIGH responde avisando que é "a mais parecida"
const SUGGEST_SCORE = 0.15; // parecida o bastante para aparecer como sugestão

const ANSWER_WEIGHT = 0.5; // palavras da resposta também contam na busca, com peso menor
const STEM_LEN = 5; // "tributos", "tributária", "tributação" -> "tribu"

const STOPWORDS = new Set(`
  a o as os um uma uns umas de da do das dos em no na nos nas num numa ao aos
  e ou que se com por para pra pelo pela pelos pelas sobre entre ate
  qual quais como sao ser esta estao este isso isto essa esse
  seu sua seus suas meu minha nosso nossa voce voces eu ele ela eles elas
  me te lhe vai vao ha tem ter fica ficam mais muito ja tambem so nao sim
  quem onde sera serao pode podem deve devem faz fazer cada todo toda todos todas caso ainda agora hoje
`.split(/\s+/).filter(Boolean));

// Palavras diferentes com o mesmo sentido na base (depois de cortadas em STEM_LEN letras).
const SYNONYMS = { acaba: 'extin', acabo: 'extin', termi: 'extin' };

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

function count(list) {
  const counts = new Map();
  for (const item of list) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

function unit(vector) {
  const norm = Math.sqrt([...vector.values()].reduce((sum, w) => sum + w * w, 0));
  return norm ? new Map([...vector].map(([t, w]) => [t, w / norm])) : new Map();
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

function parseItems(data) {
  const items = [];
  for (const modulos of Object.values(data ?? {})) {
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
        items.push({ id: p.id, pergunta: p.pergunta, resposta: p.resposta, modulo, fontes });
      }
    }
  }
  if (!items.length) throw new Error('Nenhuma pergunta encontrada no arquivo');
  return items;
}

class FaqIndex {
  constructor(items) {
    this.items = items;

    const docs = items.map((item) => {
      const tf = count(tokens(item.pergunta));
      for (const [token, c] of count(tokens(item.resposta))) {
        tf.set(token, (tf.get(token) ?? 0) + c * ANSWER_WEIGHT);
      }
      return tf;
    });

    const df = count(docs.flatMap((doc) => [...doc.keys()]));
    this.idf = new Map([...df].map(([t, d]) => [t, Math.log((docs.length + 1) / (d + 1)) + 1]));
    this.vectors = docs.map((doc) => unit(new Map([...doc].map(([t, w]) => [t, w * this.idf.get(t)]))));
    this.exact = new Map(items.map((item, i) => [words(item.pergunta).join(' '), i]));
  }

  /** [{ score, item }] de todas as perguntas, da mais parecida para a menos. */
  search(text) {
    const query = new Map();
    for (const [t, c] of count(tokens(text))) {
      if (this.idf.has(t)) query.set(t, c * this.idf.get(t));
    }
    const q = unit(query);
    const scores = this.vectors.map((vector) => {
      let score = 0;
      for (const [t, w] of q) score += w * (vector.get(t) ?? 0);
      return score;
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

export class FaqResponder {
  constructor(filePath) {
    this.path = filePath;
    this.index = null;
    this.mtime = null;
  }

  async getIndex() {
    const { mtimeMs } = await stat(this.path);
    if (mtimeMs !== this.mtime) {
      try {
        const text = (await readFile(this.path, 'utf8')).replace(/^﻿/, ''); // BOM do Bloco de Notas
        this.index = new FaqIndex(parseItems(JSON.parse(text)));
        console.info(`Perguntas carregadas: ${this.index.items.length}`);
      } catch (err) {
        if (!this.index) throw err;
        console.error(`Erro ao reler ${this.path}; mantendo a versão anterior.`, err);
      }
      this.mtime = mtimeMs;
    }
    return this.index;
  }

  async reply({ message }) {
    const index = await this.getIndex();
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
      const intro = bestScore >= HIGH_SCORE ? '' : '_Esta é a pergunta mais parecida que encontrei:_\n\n';
      const related = results.slice(1, 4).filter((r) => r.score >= SUGGEST_SCORE).map((r) => r.item.pergunta);
      return answer(`${intro}**${best.pergunta}**\n\n${best.resposta}`, {
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

function answer(reply, { sources = [], suggestions = [] } = {}) {
  return { reply, sources, suggestions };
}
