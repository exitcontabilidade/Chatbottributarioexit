// Mede a qualidade da busca do chat (o motor de lib/server/faq.js).
//
//   npm run avaliar              resumo
//   npm run avaliar -- --detalhe lista cada erro
//
// 1) scripts/consultas-teste.json: perguntas escritas como um usuário escreveria, com os ids que
//    seriam respostas aceitáveis (esperado: null = fora do assunto: NÃO deve ser respondida).
//    Ao acrescentar perguntas à base, acrescente aqui as consultas novas.
// 2) Palavras-chave: para cada pergunta da base, uma consulta curta feita só com as palavras mais
//    longas dela; a pergunta precisa aparecer entre as 3 primeiras.
//
// Uma consulta "é respondida" quando a nota da primeira passa do mínimo (THRESHOLDS.MIN).
// O pior caso é a resposta ERRADA COM CONFIANÇA: respondida, mas de outra pergunta.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const detalhe = process.argv.includes('--detalhe');
const modulo = process.env.FAQ_MODULE ?? '../lib/server/faq.js';
const { searchQuestions, THRESHOLDS } = await import(new URL(modulo, import.meta.url));
const MIN = THRESHOLDS?.MIN ?? 0.35;
const perguntasDir = path.join(root, 'Perguntas');

// --- todas as perguntas da base ---------------------------------------------------------------
const jsonFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? jsonFiles(path.join(dir, e.name)) : e.name.endsWith('.json') ? [path.join(dir, e.name)] : [],
  );
const base = [];
for (const file of jsonFiles(perguntasDir)) {
  const data = JSON.parse(readFileSync(file, 'utf8').trimStart());
  for (const [tema, modulos] of Object.entries(data)) {
    if (tema !== '_meta') for (const lista of Object.values(modulos)) base.push(...lista);
  }
}

const mesmo = (a, b) => String(a) === String(b);
const curto = (s, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// --- 1) consultas escritas à mão --------------------------------------------------------------
const consultas = JSON.parse(readFileSync(path.join(root, 'scripts', 'consultas-teste.json'), 'utf8'));
let certas = 0;
let semResposta = 0; // esperava resposta e não respondeu
let erradasConfiantes = 0; // respondeu com outra pergunta
let foraCertas = 0;
let foraTotal = 0;
const falhas = [];
const notas = []; // { score, certa } de cada consulta, para escolher a nota mínima

for (const { consulta, esperado } of consultas) {
  const [primeira] = await searchQuestions(perguntasDir, consulta, 3);
  const respondida = primeira.score >= MIN;
  notas.push({ consulta, score: primeira.score, certa: esperado === null ? false : esperado.some((id) => mesmo(id, primeira.id)) });
  if (esperado === null) {
    foraTotal++;
    if (!respondida) foraCertas++;
    else {
      erradasConfiantes++;
      falhas.push(`FORA DO ASSUNTO respondida (${primeira.score.toFixed(2)}): "${consulta}" -> ${primeira.id} ${curto(primeira.pergunta)}`);
    }
    continue;
  }
  const acertou = esperado.some((id) => mesmo(id, primeira.id));
  if (acertou && respondida) certas++;
  else if (!respondida) {
    semResposta++;
    falhas.push(`SEM RESPOSTA (${primeira.score.toFixed(2)}): "${consulta}" (esperado ${esperado.join('/')}; achou ${primeira.id})`);
  } else {
    erradasConfiantes++;
    falhas.push(`ERRADA (${primeira.score.toFixed(2)}): "${consulta}" -> ${primeira.id} ${curto(primeira.pergunta)} (esperado ${esperado.join('/')})`);
  }
}
const dentro = consultas.length - foraTotal;

// --- 2) palavras-chave de cada pergunta -------------------------------------------------------
const STOP = new Set('que qual quais como para pela pelo pelos pelas sobre entre esta este isso essa esse seus suas mais muito também quando onde será serão pode podem deve devem cada todo toda todos todas caso ainda agora'.split(' '));
let top1 = 0;
let top3 = 0;
let total = 0;
const falhasChave = [];
for (const item of base) {
  const palavras = item.pergunta
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()));
  const escolhidas = [...new Set(palavras)].sort((a, b) => b.length - a.length).slice(0, 3);
  if (escolhidas.length < 2) continue;
  total++;
  const consulta = palavras.filter((w) => escolhidas.includes(w)).join(' ');
  const achadas = await searchQuestions(perguntasDir, consulta, 3);
  if (mesmo(achadas[0].id, item.id)) top1++;
  if (achadas.some((r) => mesmo(r.id, item.id))) top3++;
  else falhasChave.push(`"${consulta}" não achou ${item.id}: ${curto(item.pergunta, 60)} (veio ${achadas[0].id})`);
}

// --- resultado --------------------------------------------------------------------------------
const pct = (n, d) => `${((100 * n) / d).toFixed(0)}%`;
console.log(`Base: ${base.length} perguntas | mínimo para responder: ${MIN}${THRESHOLDS ? '' : ' (motor antigo)'}\n`);
console.log('Consultas escritas à mão');
console.log(`  respostas certas ............ ${certas}/${dentro} (${pct(certas, dentro)})`);
console.log(`  sem resposta (deveria ter) .. ${semResposta}`);
console.log(`  ERRADAS COM CONFIANÇA ....... ${erradasConfiantes}`);
console.log(`  fora do assunto ignoradas ... ${foraCertas}/${foraTotal}`);
console.log('\nPalavras-chave de cada pergunta');
console.log(`  1ª colocada ................. ${top1}/${total} (${pct(top1, total)})`);
console.log(`  entre as 3 primeiras ........ ${top3}/${total} (${pct(top3, total)})`);
if (process.argv.includes('--notas')) {
  // Para cada nota mínima possível: quantas certas responderia e quantas erradas responderia.
  console.log('\nNota mínima -> certas respondidas | erradas respondidas (fora do assunto ou de outra pergunta)');
  for (let min = 0.3; min <= 0.66; min += 0.04) {
    const certasR = notas.filter((n) => n.certa && n.score >= min).length;
    const erradasR = notas.filter((n) => !n.certa && n.score >= min).length;
    console.log(`  ${min.toFixed(2)} -> ${certasR} | ${erradasR}`);
  }
}
if (detalhe) {
  if (falhas.length) console.log(`\nFalhas nas consultas:\n  ${falhas.join('\n  ')}`);
  if (falhasChave.length) console.log(`\nFalhas nas palavras-chave (${falhasChave.length}):\n  ${falhasChave.slice(0, 40).join('\n  ')}`);
}
