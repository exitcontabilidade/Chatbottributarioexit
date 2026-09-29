// Markdown simples para as respostas do bot: **negrito**, *itálico*, _itálico_,
// `código`, blocos ```código```, listas (- item / 1. item), títulos (#) e links.
// Todo o texto é escapado, então HTML vindo da resposta nunca é interpretado.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const INLINE_MARK = '\u0000';
const BLOCK_MARK = '\u0001';
const BLOCK_LINE = /^\u0001\d+\u0001$/;

const link = (url, label) =>
  `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;

function inline(line) {
  return line
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
}

export function renderMarkdown(source) {
  // Trechos já convertidos (código, links) ficam guardados e voltam só no fim,
  // para a formatação de negrito/itálico não mexer dentro deles.
  const saved = [];
  const keep = (html, block = false) => {
    const mark = block ? BLOCK_MARK : INLINE_MARK;
    return `${mark}${saved.push(html) - 1}${mark}`;
  };

  let text = String(source ?? '')
    .replace(/[\u0000\u0001]/g, '')
    .replace(/\r\n?/g, '\n');

  text = text
    .replace(/```(?:[\w+-]*\n)?([\s\S]*?)```/g, (_, code) =>
      `\n${keep(`<pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`, true)}\n`)
    .replace(/`([^`\n]+)`/g, (_, code) => keep(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => keep(link(url, label)))
    .replace(/https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)]/g, (url) => keep(link(url, url)));

  text = escapeHtml(text);

  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${paragraph.join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const item = line.match(/^\s*(?:([-*•])|\d+[.)])\s+(.*)$/);
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);

    if (!trimmed) {
      flushParagraph();
      flushList();
    } else if (BLOCK_LINE.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push(trimmed);
    } else if (item) {
      flushParagraph();
      const tag = item[1] ? 'ul' : 'ol';
      if (list?.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push(inline(item[2]));
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push(`<p><strong>${inline(heading[1])}</strong></p>`);
    } else {
      flushList();
      paragraph.push(inline(line));
    }
  }
  flushParagraph();
  flushList();

  return blocks.join('').replace(/[\u0000\u0001](\d+)[\u0000\u0001]/g, (_, i) => saved[Number(i)]);
}
