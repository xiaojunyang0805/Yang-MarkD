import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Base directory of the currently opened file (set when a file is opened)
let _baseDir = '';

export function setBaseDir(dir) {
  _baseDir = dir;
}

export function getBaseDir() {
  return _baseDir;
}

function isAbsoluteUrl(url) {
  return /^(https?:|data:|blob:|asset:|file:)/i.test(url);
}

function resolveImagePath(href) {
  if (!_baseDir || !href || isAbsoluteUrl(href)) return null;
  const base = _baseDir.replace(/\\/g, '/');
  const decoded = decodeURIComponent(href);
  return base + '/' + decoded;
}

// Custom renderer to add class names matching the original styling
const renderer = new marked.Renderer();

renderer.heading = ({ tokens, depth }) => {
  const text = marked.Parser.parseInline(tokens);
  const id = tokens
    .map((t) => t.raw)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `<h${depth} class="md-h${depth}" data-heading-id="${id}">${text}</h${depth}>\n`;
};

renderer.paragraph = ({ tokens }) => {
  const text = marked.Parser.parseInline(tokens);
  return `<p class="md-p">${text}</p>\n`;
};

renderer.link = ({ href, tokens }) => {
  const text = marked.Parser.parseInline(tokens);
  return `<a href="${href}" rel="noopener" class="md-link" data-external-link>${text}</a>`;
};

renderer.image = ({ href, text }) => {
  const absPath = resolveImagePath(href);
  if (absPath) {
    return `<img alt="${text}" data-file-path="${absPath}" class="md-image" />`;
  }
  return `<img alt="${text}" src="${href}" class="md-image" />`;
};

renderer.blockquote = ({ tokens }) => {
  const body = marked.Parser.parse(tokens);
  return `<blockquote class="md-blockquote">${body}</blockquote>\n`;
};

renderer.code = ({ text, lang }) => {
  const hasBoxDrawing = /[\u2500-\u257F\u2580-\u259F\u2190-\u21FF\u25A0-\u25FF]/.test(text);

  if (hasBoxDrawing) {
    // Force fixed-width character grid for ASCII art / box-drawing diagrams
    const html = text.split('\n').map((line) => {
      const chars = [...line].map((ch) => {
        if (ch === ' ') return '<span class="cc">\u00A0</span>';
        if (ch === '&') return '<span class="cc">&amp;</span>';
        if (ch === '<') return '<span class="cc">&lt;</span>';
        if (ch === '>') return '<span class="cc">&gt;</span>';
        return `<span class="cc">${ch}</span>`;
      }).join('');
      return chars;
    }).join('\n');
    return `<pre class="code-block code-block-diagram" data-lang="${lang || ''}"><code>${html}</code></pre>\n`;
  }

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre class="code-block" data-lang="${lang || ''}"><code>${escaped}</code></pre>\n`;
};

renderer.codespan = ({ text }) => {
  return `<code class="inline-code">${text}</code>`;
};

renderer.list = ({ ordered, items }) => {
  const tag = ordered ? 'ol' : 'ul';
  const cls = ordered ? 'md-ol' : 'md-ul';
  const body = items.map((item) => renderer.listitem(item)).join('');
  return `<${tag} class="${cls}">${body}</${tag}>\n`;
};

renderer.listitem = ({ tokens, checked }) => {
  if (checked !== undefined) {
    const body = marked.Parser.parse(tokens);
    const icon = checked
      ? '<span class="checkbox checked">✓</span>'
      : '<span class="checkbox">○</span>';
    const cls = checked ? 'task-item done' : 'task-item';
    return `<div class="${cls}">${icon}${body}</div>\n`;
  }
  const text = marked.Parser.parse(tokens);
  return `<li class="md-li">${text}</li>\n`;
};

renderer.table = ({ header, rows }) => {
  let html = '<div class="table-wrap"><table class="md-table"><thead><tr>';
  header.forEach((cell) => {
    const text = marked.Parser.parseInline(cell.tokens);
    html += `<th>${text}</th>`;
  });
  html += '</tr></thead><tbody>';
  rows.forEach((row) => {
    html += '<tr>';
    row.forEach((cell) => {
      const text = marked.Parser.parseInline(cell.tokens);
      html += `<td>${text}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>\n';
  return html;
};

renderer.hr = () => {
  return '<hr class="md-hr" />\n';
};

renderer.strong = ({ tokens }) => {
  const text = marked.Parser.parseInline(tokens);
  return `<strong>${text}</strong>`;
};

renderer.em = ({ tokens }) => {
  const text = marked.Parser.parseInline(tokens);
  return `<em>${text}</em>`;
};

renderer.del = ({ tokens }) => {
  const text = marked.Parser.parseInline(tokens);
  return `<del>${text}</del>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
});

/**
 * Render markdown string to sanitized HTML.
 * @param {string} md - Raw markdown string
 * @returns {string} Sanitized HTML string
 */
export function renderMarkdown(md) {
  if (!md) return '';
  const raw = marked.parse(md);
  return DOMPurify.sanitize(raw);
}
