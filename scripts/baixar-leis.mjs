// Baixa as leis da reforma do site do Planalto e separa por artigo, SÓ COM O TEXTO VIGENTE.
//
//   npm run leis              baixa o que faltar e converte (pasta .leis/, fora do git)
//   npm run leis -- --forcar  baixa de novo (quando as leis mudarem)
//
// O Planalto mostra a redação antiga riscada ao lado da nova: aqui o riscado é descartado.
// Saídas em .leis/: <lei>.txt (para ler) e <lei>.json (artigos, usados por npm run conferir).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), '.leis');
const forcar = process.argv.includes('--forcar');

const LEIS = {
  emc132: { nome: 'EC 132/2023', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm' },
  lcp214: { nome: 'LC 214/2025', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm' },
  lcp227: { nome: 'LC 227/2026', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm' },
};

// O Planalto não responde a pedidos que não pareçam de um navegador.
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

mkdirSync(dir, { recursive: true });

// --- download (curl respeita o proxy da rede) --------------------------------------------------
for (const [file, { nome, url }] of Object.entries(LEIS)) {
  const htm = path.join(dir, `${file}.htm`);
  if (existsSync(htm) && !forcar) continue;
  console.log(`Baixando ${nome}…`);
  try {
    execFileSync('curl', ['-sSL', '--max-time', '180', '-A', USER_AGENT, '-H', 'Accept-Language: pt-BR,pt;q=0.9', '-o', htm, url], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
  } catch (err) {
    console.error(`Não consegui baixar ${nome} (${url}). Confira a internet/proxy e se o curl está instalado.`);
    process.exit(1);
  }
  if (!existsSync(htm) || statSync(htm).size < 100_000) {
    console.error(`O arquivo baixado de ${nome} está vazio ou pequeno demais (site fora do ar ou bloqueou o pedido).`);
    process.exit(1);
  }
}

// --- HTML -> texto -----------------------------------------------------------------------------
const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', deg: '°', sect: '§', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', bull: '•', middot: '·' };
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);

const BLOCK = new Set(['p', 'div', 'tr', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table']);
const VOID = new Set(['img', 'hr', 'meta', 'link', 'input', 'col']);

function toText(source) {
  // Espaços e quebras do código-fonte valem como um espaço só (como no navegador).
  let html = source
    .replace(/<head[\s\S]*?<\/head>/i, '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ');
  // Começo de artigo: força uma linha nova (o texto "Art. N" vem logo depois da âncora).
  // A aspa de abertura de um artigo citado fica junto do "Art." (para reconhecê-lo como citação).
  html = html.replace(
    /((?:["“”]|&quot;|&ldquo;|&rdquo;)?\s*)(<a\s+name="art\d+(?:-?[a-z]{1,2})?"[^>]*>)/gi,
    (_, quote, tag) => `\n${quote}${tag}`,
  );

  const out = [];
  const stack = []; // { name, struck }
  let struckDepth = 0; // > 0 = dentro de texto riscado (revogado/substituído): não vale mais

  for (const m of html.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/gi)) {
    if (m[4] !== undefined) {
      if (!struckDepth) out.push(m[4]);
      continue;
    }
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const attrs = m[3];

    if (closing) {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].name !== name) i--;
      if (i >= 0) {
        while (stack.length > i) if (stack.pop().struck) struckDepth--;
      }
      if (BLOCK.has(name) && !struckDepth) out.push('\n');
    } else if (name === 'br') {
      if (!struckDepth) out.push('\n');
    } else if (!VOID.has(name) && !/\/\s*$/.test(attrs)) {
      if (name === 'a' && !struckDepth) {
        // nome da âncora do artigo, guardado como marcador \u0001nome\u0001 (vira o link #art26)
        const anchor = /name="(art\d+(?:-?[a-z]{1,2})?)"/i.exec(attrs);
        if (anchor) out.push(`\u0001${anchor[1]}\u0001`);
      }
      const struck = name === 'strike' || name === 's' || name === 'del' || /line-through/i.test(attrs);
      stack.push({ name, struck });
      if (struck) struckDepth++;
    }
  }

  return decode(out.join(''))
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// --- texto -> artigos --------------------------------------------------------------------------
// "Art. 26." / "Art. 26-A." / "Art. 1º" no começo da linha. m[1] = aspa: artigo citado entre aspas.
const ART = /^(["“”]?)\s*Art\.\s*(\d+)\s*(?:º|°|o)?\s*(?:-\s*([A-Z]{1,2}))?\s*[.º°]?\s*/;
const HEADING = /^(LIVRO|PARTE|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\b/i;
const NIVEL = { LIVRO: 0, PARTE: 1, TÍTULO: 2, CAPÍTULO: 3, SEÇÃO: 4, SUBSEÇÃO: 5 };
const nivel = (h) => NIVEL[h.split(/\s/)[0].toUpperCase()] ?? 9;

for (const [file, { nome }] of Object.entries(LEIS)) {
  const text = toText(new TextDecoder('windows-1252').decode(readFileSync(path.join(dir, `${file}.htm`))));
  const articles = [];
  let current = null;
  let heading = [];
  let context = 'EC'; // EC 132: em que texto estamos (CF, ADCT ou os artigos da própria emenda)
  let nextOwn = 1; // número do próximo artigo da própria lei (EC 132 e LC 227)

  for (const raw of text.split('\n')) {
    const anchor = /\u0001([^\u0001]+)\u0001/.exec(raw)?.[1] ?? '';
    const line = raw.replace(/\u0001[^\u0001]*\u0001/g, '').trim();
    if (HEADING.test(line) && line.length < 160) {
      heading = [...heading.filter((h) => nivel(h) < nivel(line)), line];
      continue;
    }

    const m = ART.exec(line);
    // Artigo citado entre aspas só vale na EC 132. Na LC 227 (e na 214) as citações são alterações a
    // outras leis: na 227 só entra o que segue a numeração própria (tolera artigo revogado inteiro).
    const number = m ? Number(m[2]) : 0;
    const own = m && !m[1] && !m[3] && number >= nextOwn && number <= nextOwn + 3;
    const isArticle = !m
      ? false
      : file === 'emc132'
        ? true
        : file === 'lcp227'
          ? own || (!m[1] && m[3] && number < nextOwn && number > nextOwn - 3)
          : !m[1];

    if (isArticle) {
      if (file === 'lcp227' && own) nextOwn = number + 1;
      const suffix = m[3] ? `-${m[3]}` : '';
      let label = `${m[2]}${suffix}`;
      if (file === 'emc132') {
        // Artigos próprios da emenda: 1, 2, 3... em sequência. Os demais são artigos da CF/ADCT citados.
        if (!m[1] && !suffix && number === nextOwn) {
          nextOwn++;
          context = { 1: 'CF', 2: 'ADCT', 3: 'CF [EC art. 3º]', 4: 'CF [EC art. 4º]' }[m[2]] ?? 'EC';
          label = `EC ${label}`;
        } else {
          label = `${context} ${label}`;
        }
      }
      current = { law: nome, label, anchor, heading: heading.join(' > '), text: line };
      articles.push(current);
    } else if (current) {
      current.text += '\n' + line;
    }
  }

  writeFileSync(path.join(dir, `${file}.json`), JSON.stringify(articles));
  writeFileSync(
    path.join(dir, `${file}.txt`),
    articles.map((a) => `@@ ${nome} — art. ${a.label} @@ ${a.heading ? `[${a.heading}]` : ''}\n${a.text}`).join('\n\n'),
  );
  const kb = Math.round(articles.reduce((n, a) => n + a.text.length, 0) / 1024);
  console.log(`${nome}: ${articles.length} artigos, ${kb} KB de texto`);
}
