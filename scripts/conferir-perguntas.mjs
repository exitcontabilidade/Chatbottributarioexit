// Confere as perguntas baseadas nas leis contra o texto oficial (Planalto).
//
//   npm run leis        baixa as leis e separa por artigo (pasta .leis/, só na primeira vez)
//   npm run conferir    roda esta conferência
//
// O que confere, em cada pergunta com fontes (campos "lei" e "artigos" na fonte):
//   ERRO   id repetido, pergunta/resposta vazia, sem fonte, artigo citado que não existe
//          (ou foi revogado por inteiro), link que não aponta para o artigo citado
//   AVISO  número da resposta (percentual, prazo, ano, valor) que não aparece nos artigos citados
//          -> pode ser conta feita pela resposta (ex.: 27 + 27) ou erro: vale olhar
// As 210 perguntas antigas (sem fonte) só entram na contagem.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const leisDir = process.env.LEIS_DIR ?? path.join(root, '.leis');
const perguntasDir = path.join(root, 'Perguntas');

const LEIS = { emc132: 'EC 132/2023', lcp214: 'LC 214/2025', lcp227: 'LC 227/2026' };

// --- leis -------------------------------------------------------------------------------------
const artigosPorLei = {};
for (const lei of Object.keys(LEIS)) {
  const file = path.join(leisDir, `${lei}.json`);
  if (!existsSync(file)) {
    console.error(`Falta ${file}. Rode antes: npm run leis`);
    process.exit(2);
  }
  artigosPorLei[lei] = new Map(JSON.parse(readFileSync(file, 'utf8')).map((a) => [a.label, a]));
}

// --- perguntas --------------------------------------------------------------------------------
function jsonFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

const itens = [];
for (const file of jsonFiles(perguntasDir)) {
  const data = JSON.parse(readFileSync(file, 'utf8').trimStart()); // trimStart tira o BOM do Bloco de Notas
  for (const [tema, modulos] of Object.entries(data)) {
    if (tema === '_meta') continue; // nomes de grupos/temas/módulos, não são perguntas
    for (const [modulo, lista] of Object.entries(modulos)) {
      for (const item of lista) itens.push({ file: path.relative(root, file), tema, modulo, item });
    }
  }
}

// --- conferência ------------------------------------------------------------------------------
const erros = [];
const avisos = [];
const erro = (id, msg) => erros.push(`${id}: ${msg}`);
const aviso = (id, msg) => avisos.push(`${id}: ${msg}`);

const semEspaco = (s) => s.replace(/\s+/g, ' ');
const numeros = (texto) => texto.match(/\d+(?:[.,]\d+)*/g) ?? [];
const ids = new Map();
let comFonte = 0;

for (const { file, item } of itens) {
  const id = String(item.id);
  if (ids.has(id)) erro(id, `id repetido (também em ${ids.get(id)})`);
  ids.set(id, file);

  if (typeof item.pergunta !== 'string' || !item.pergunta.trim()) erro(id, 'pergunta vazia');
  if (typeof item.resposta !== 'string' || !item.resposta.trim()) erro(id, 'resposta vazia');

  const fontes = Array.isArray(item.fontes) ? item.fontes : [];
  const baseadaEmLei = fontes.some((f) => f.lei);
  if (!baseadaEmLei) {
    if (file.includes(`${path.sep}leis${path.sep}`)) erro(id, 'pergunta da pasta leis/ sem fonte com "lei" e "artigos"');
    continue;
  }
  comFonte++;

  let textoCitado = '';
  for (const fonte of fontes) {
    const artigos = artigosPorLei[fonte.lei];
    if (!artigos) {
      erro(id, `lei desconhecida "${fonte.lei}"`);
      continue;
    }
    if (fonte.norma !== LEIS[fonte.lei]) {
      // EC 132: as fontes que citam a Constituição usam a norma da emenda
      erro(id, `norma "${fonte.norma}" não bate com a lei ${fonte.lei} (${LEIS[fonte.lei]})`);
    }
    if (!Array.isArray(fonte.artigos) || !fonte.artigos.length) erro(id, `fonte "${fonte.referencia}" sem "artigos"`);
    for (const label of fonte.artigos ?? []) {
      const artigo = artigos.get(label);
      if (!artigo) {
        erro(id, `artigo "${label}" não existe em ${LEIS[fonte.lei]} (ou foi revogado por inteiro)`);
        continue;
      }
      textoCitado += ` ${artigo.text}`;
      if (/^Art\. [\d-A-Z]+\.? \(Revogado/i.test(semEspaco(artigo.text))) erro(id, `artigo "${label}" está revogado`);
    }
    // O link precisa apontar para o primeiro artigo citado.
    const primeiro = artigos.get(fonte.artigos?.[0]);
    if (primeiro && typeof fonte.url === 'string') {
      const ancora = fonte.lei === 'emc132' ? (fonte.artigos[0].startsWith('ADCT') ? 'art2' : 'art1') : `art${primeiro.label.toLowerCase().replace('-', '')}`;
      if (!fonte.url.startsWith('https://www.planalto.gov.br/') || !fonte.url.endsWith(`#${ancora}`)) {
        erro(id, `link "${fonte.url}" não aponta para #${ancora}`);
      }
    } else if (!fonte.url) {
      erro(id, `fonte "${fonte.referencia}" sem url`);
    }
  }

  // Números da resposta que não aparecem nos artigos citados.
  const resposta = String(item.resposta)
    .replace(/\*\*/g, '')
    .replace(/^\s*\d+\.\s/gm, '') // numeração de listas
    .replace(/\b(?:LC|EC|Lei Complementar|Lei|Emenda Constitucional)\s*(?:nº\s*)?\d[\d./]*/g, '') // nome de outras normas
    // citações de artigo/parágrafo ("art. 51", "arts. 31 a 34", "§§ 3º e 4º"): não são dados da resposta
    .replace(/(?:\barts?\.|§§?)\s*\d+[º°]?(?:-[A-Z])?(?:\s*(?:,|e|a|ao|ou)\s*\d+[º°]?(?:-[A-Z])?)*/g, '');
  const noTexto = new Set(numeros(semEspaco(textoCitado)));
  const soltos = [...new Set(numeros(resposta))].filter((n) => !noTexto.has(n) && !noTexto.has(n.replace(/[.,]$/, '')));
  if (soltos.length) aviso(id, `número(s) fora dos artigos citados: ${soltos.join(', ')}`);
}

// --- resultado --------------------------------------------------------------------------------
console.log(`Perguntas: ${itens.length} (${comFonte} conferidas nas leis, ${itens.length - comFonte} sem fonte)`);
if (avisos.length) console.log(`\nAVISOS (${avisos.length}) — confira se são contas da resposta ou erros:\n  ${avisos.join('\n  ')}`);
if (erros.length) {
  console.log(`\nERROS (${erros.length}):\n  ${erros.join('\n  ')}`);
  process.exit(1);
}
console.log('\nSem erros.');
