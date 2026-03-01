import { useState, useEffect, useRef, useCallback } from "react";

// Simple but solid Markdown parser
function parseMarkdown(md) {
  if (!md) return "";
  let html = md;

  // Code blocks (fenced)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return `<pre class="code-block" data-lang="${lang}"><code>${escaped}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="md-image" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="md-h6">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="md-h5">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Horizontal rule
  html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr class="md-hr" />');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  // Task lists
  html = html.replace(/^[-*]\s+\[x\]\s+(.+)$/gm, '<div class="task-item done"><span class="checkbox checked">✓</span>$1</div>');
  html = html.replace(/^[-*]\s+\[\s?\]\s+(.+)$/gm, '<div class="task-item"><span class="checkbox">○</span>$1</div>');

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    const items = match.replace(/<\/?oli>/g, '').split('\n').filter(Boolean);
    return '<ol class="md-ol">' + items.map(i => `<li class="md-li">${i}</li>`).join('') + '</ol>';
  });

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, header, _align, body) => {
    const headers = header.split('|').filter(c => c.trim());
    const rows = body.trim().split('\n').map(r => r.split('|').filter(c => c.trim()));
    let table = '<div class="table-wrap"><table class="md-table"><thead><tr>';
    headers.forEach(h => { table += `<th>${h.trim()}</th>`; });
    table += '</tr></thead><tbody>';
    rows.forEach(row => {
      table += '<tr>';
      row.forEach(cell => { table += `<td>${cell.trim()}</td>`; });
      table += '</tr>';
    });
    table += '</tbody></table></div>';
    return table;
  });

  // Paragraphs - wrap remaining loose text
  html = html.replace(/^(?!<[a-z/]|$)(.+)$/gm, '<p class="md-p">$1</p>');

  // Clean up consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote class="md-blockquote">/g, '<br/>');

  return html;
}

function extractHeadings(md) {
  if (!md) return [];
  const headings = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  }
  return headings;
}

function wordCount(md) {
  if (!md) return { words: 0, chars: 0, lines: 0, readTime: 0 };
  const text = md.replace(/```[\s\S]*?```/g, '').replace(/[#*_`>\[\]()!|]/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return {
    words,
    chars: md.length,
    lines: md.split('\n').length,
    readTime: Math.max(1, Math.ceil(words / 200)),
  };
}

const SAMPLE_MD = `# Welcome to MarkView

A clean, distraction-free Markdown viewer. Drop a \`.md\` file here or use the **Open File** button above.

## Features

- **Drag & drop** any Markdown file
- Clean, reader-focused typography
- Table of contents sidebar
- Dark and light themes
- Document statistics

## Getting Started

### Opening Files

Click the **Open File** button in the toolbar, or simply drag a \`.md\` file anywhere onto this window.

### Navigation

Use the **Table of Contents** panel on the left to jump between sections. It auto-generates from your document headings.

## Syntax Support

Here's what's supported:

### Text Formatting

Regular text with **bold**, *italic*, ***bold italic***, and ~~strikethrough~~.

### Code

Inline \`code\` and fenced blocks:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

### Blockquotes

> "Simplicity is the ultimate sophistication."
> — Leonardo da Vinci

### Tables

| Feature | Status |
|---------|--------|
| Headings | ✅ |
| Lists | ✅ |
| Code blocks | ✅ |
| Tables | ✅ |
| Task lists | ✅ |

### Task Lists

- [x] Build markdown parser
- [x] Add theming support
- [ ] Add more features
- [ ] World domination

---

*Built with care. Enjoy reading.*
`;

export default function MarkdownViewer() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [fileName, setFileName] = useState("welcome.md");
  const [theme, setTheme] = useState("light");
  const [tocOpen, setTocOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showRaw, setShowRaw] = useState(false);
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);

  const headings = extractHeadings(markdown);
  const stats = wordCount(markdown);

  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.md')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setMarkdown(e.target.result);
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const scrollToHeading = (id) => {
    const el = contentRef.current?.querySelector(`[data-heading-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderedHtml = parseMarkdown(markdown).replace(
    /<h([1-3]) class="md-h\d">(.+?)<\/h\d>/g,
    (_, level, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `<h${level} class="md-h${level}" data-heading-id="${id}">${text}</h${level}>`;
    }
  );

  const dark = theme === "dark";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Newsreader', 'Georgia', serif",
        background: dark ? "#1a1a1e" : "#f8f7f4",
        color: dark ? "#d4d3cf" : "#2c2c2c",
        position: "relative",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Drop overlay */}
      {isDragging && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 999,
          background: dark ? "rgba(26,26,30,0.92)" : "rgba(248,247,244,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `3px dashed ${dark ? "#6b8afd" : "#4a6cf7"}`,
          borderRadius: 12, margin: 8,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 20, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: dark ? "#6b8afd" : "#4a6cf7" }}>
              Drop your .md file here
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        height: 52, minHeight: 52, display: "flex", alignItems: "center",
        padding: "0 16px", gap: 8,
        borderBottom: `1px solid ${dark ? "#2a2a2e" : "#e8e6e1"}`,
        fontFamily: "'DM Sans', sans-serif",
        background: dark ? "#1e1e22" : "#ffffff",
        fontSize: 13,
      }}>
        <button onClick={() => setTocOpen(!tocOpen)} title="Toggle Table of Contents" style={btnStyle(dark, tocOpen)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M2 8h8M2 12h10" />
          </svg>
        </button>

        <div style={{
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          padding: "0 8px", fontWeight: 500, fontSize: 14,
          color: dark ? "#b0afab" : "#555",
        }}>
          {fileName}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, color: dark ? "#666" : "#aaa", fontSize: 12, marginRight: 8 }}>
          <span>{stats.words} words</span>
          <span style={{ margin: "0 4px" }}>·</span>
          <span>{stats.readTime} min read</span>
        </div>

        <button onClick={() => setFontSize(f => Math.max(12, f - 1))} title="Decrease font size" style={btnStyle(dark)}>A−</button>
        <button onClick={() => setFontSize(f => Math.min(24, f + 1))} title="Increase font size" style={btnStyle(dark)}>A+</button>

        <button onClick={() => setShowRaw(!showRaw)} title="Toggle raw markdown" style={btnStyle(dark, showRaw)}>
          {showRaw ? "Rich" : "Raw"}
        </button>

        <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme" style={btnStyle(dark)}>
          {dark ? "☀️" : "🌙"}
        </button>

        <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])} />
        <button onClick={() => fileInputRef.current?.click()} style={{
          ...btnStyle(dark), background: dark ? "#6b8afd" : "#4a6cf7",
          color: "#fff", fontWeight: 600, padding: "6px 14px", borderRadius: 6,
        }}>
          Open File
        </button>
      </div>

      {/* Main area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* TOC Sidebar */}
        {tocOpen && headings.length > 0 && (
          <div style={{
            width: 240, minWidth: 240, padding: "20px 16px", overflowY: "auto",
            borderRight: `1px solid ${dark ? "#2a2a2e" : "#e8e6e1"}`,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            background: dark ? "#1e1e22" : "#ffffff",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.1em", color: dark ? "#555" : "#999", marginBottom: 14,
            }}>
              Contents
            </div>
            {headings.map((h, i) => (
              <div key={i}
                onClick={() => scrollToHeading(h.id)}
                style={{
                  padding: "5px 0",
                  paddingLeft: (h.level - 1) * 14,
                  cursor: "pointer",
                  color: dark ? "#8a8a8a" : "#666",
                  fontWeight: h.level === 1 ? 600 : 400,
                  fontSize: h.level === 1 ? 13 : 12.5,
                  transition: "color 0.15s",
                  lineHeight: 1.5,
                }}
                onMouseEnter={(e) => e.target.style.color = dark ? "#6b8afd" : "#4a6cf7"}
                onMouseLeave={(e) => e.target.style.color = dark ? "#8a8a8a" : "#666"}
              >
                {h.text}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} style={{
          flex: 1, overflowY: "auto", padding: "40px 20px",
          display: "flex", justifyContent: "center",
        }}>
          <div style={{ maxWidth: 720, width: "100%" }}>
            {showRaw ? (
              <pre style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: fontSize - 2, lineHeight: 1.7, whiteSpace: "pre-wrap",
                color: dark ? "#b0afab" : "#444", padding: 20,
                background: dark ? "#141416" : "#faf9f6",
                borderRadius: 8, border: `1px solid ${dark ? "#2a2a2e" : "#e8e6e1"}`,
              }}>
                {markdown}
              </pre>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                style={{ fontSize }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "#333" : "#d0d0d0"}; border-radius: 3px; }

        .md-h1 {
          font-size: 2.1em; font-weight: 600; margin: 1.4em 0 0.6em; line-height: 1.2;
          color: ${dark ? "#e8e7e3" : "#1a1a1a"};
          letter-spacing: -0.02em;
        }
        .md-h1:first-child { margin-top: 0; }
        .md-h2 {
          font-size: 1.55em; font-weight: 500; margin: 1.6em 0 0.5em; line-height: 1.3;
          color: ${dark ? "#d4d3cf" : "#2c2c2c"};
          padding-bottom: 6px;
          border-bottom: 1px solid ${dark ? "#2a2a2e" : "#e8e6e1"};
        }
        .md-h3 {
          font-size: 1.2em; font-weight: 500; margin: 1.3em 0 0.4em; line-height: 1.4;
          color: ${dark ? "#c0bfbb" : "#3a3a3a"};
        }
        .md-h4, .md-h5, .md-h6 {
          font-size: 1.05em; font-weight: 500; margin: 1.2em 0 0.3em;
          color: ${dark ? "#a0a09c" : "#555"};
        }
        .md-p {
          margin: 0.75em 0; line-height: 1.75;
          color: ${dark ? "#b8b7b3" : "#3a3a3a"};
        }
        .md-link {
          color: ${dark ? "#6b8afd" : "#4a6cf7"};
          text-decoration: none;
          border-bottom: 1px solid ${dark ? "rgba(107,138,253,0.3)" : "rgba(74,108,247,0.3)"};
          transition: border-color 0.15s;
        }
        .md-link:hover { border-bottom-color: currentColor; }
        .md-image { max-width: 100%; border-radius: 8px; margin: 1em 0; }

        .inline-code {
          font-family: 'JetBrains Mono', monospace; font-size: 0.88em;
          background: ${dark ? "#252528" : "#f0eee9"};
          color: ${dark ? "#e0a0a0" : "#c7254e"};
          padding: 2px 6px; border-radius: 4px;
        }
        .code-block {
          font-family: 'JetBrains Mono', monospace; font-size: 0.85em;
          background: ${dark ? "#141416" : "#faf9f6"};
          color: ${dark ? "#b0afab" : "#444"};
          padding: 18px 20px; border-radius: 8px; overflow-x: auto;
          margin: 1em 0; line-height: 1.65;
          border: 1px solid ${dark ? "#2a2a2e" : "#e8e6e1"};
        }
        .code-block[data-lang]:not([data-lang=""])::before {
          content: attr(data-lang);
          display: block; font-size: 10px; text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 10px;
          color: ${dark ? "#555" : "#aaa"};
          font-family: 'DM Sans', sans-serif; font-weight: 600;
        }

        .md-blockquote {
          border-left: 3px solid ${dark ? "#6b8afd" : "#4a6cf7"};
          padding: 8px 20px; margin: 1em 0;
          color: ${dark ? "#999" : "#666"};
          font-style: italic;
          background: ${dark ? "rgba(107,138,253,0.05)" : "rgba(74,108,247,0.03)"};
          border-radius: 0 6px 6px 0;
        }

        .md-ul, .md-ol {
          margin: 0.6em 0; padding-left: 24px;
        }
        .md-li {
          margin: 0.3em 0; line-height: 1.7;
          color: ${dark ? "#b8b7b3" : "#3a3a3a"};
        }

        .task-item {
          display: flex; align-items: baseline; gap: 8px;
          margin: 4px 0; line-height: 1.7;
          color: ${dark ? "#b8b7b3" : "#3a3a3a"};
        }
        .task-item.done { color: ${dark ? "#666" : "#aaa"}; text-decoration: line-through; }
        .checkbox {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0;
          font-size: 11px; border: 1.5px solid ${dark ? "#444" : "#ccc"};
          color: ${dark ? "#555" : "#bbb"};
        }
        .checkbox.checked {
          background: ${dark ? "#6b8afd" : "#4a6cf7"};
          border-color: ${dark ? "#6b8afd" : "#4a6cf7"};
          color: #fff;
        }

        .md-hr {
          border: none; height: 1px; margin: 2em 0;
          background: ${dark ? "#2a2a2e" : "#e0ded9"};
        }

        .table-wrap { overflow-x: auto; margin: 1em 0; border-radius: 8px; border: 1px solid ${dark ? "#2a2a2e" : "#e8e6e1"}; }
        .md-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; font-size: 0.9em;
        }
        .md-table th {
          text-align: left; padding: 10px 14px; font-weight: 600;
          background: ${dark ? "#222225" : "#f4f3f0"};
          color: ${dark ? "#b0afab" : "#555"};
          border-bottom: 1.5px solid ${dark ? "#333" : "#ddd"};
        }
        .md-table td {
          padding: 9px 14px;
          border-bottom: 1px solid ${dark ? "#2a2a2e" : "#eee"};
          color: ${dark ? "#999" : "#555"};
        }
        .md-table tr:last-child td { border-bottom: none; }
      `}</style>
    </div>
  );
}

function btnStyle(dark, active = false) {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 32, minWidth: 32, padding: "0 8px",
    border: `1px solid ${dark ? "#333" : "#ddd"}`,
    borderRadius: 6, cursor: "pointer", fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    background: active
      ? (dark ? "rgba(107,138,253,0.15)" : "rgba(74,108,247,0.08)")
      : (dark ? "#252528" : "#faf9f6"),
    color: active
      ? (dark ? "#6b8afd" : "#4a6cf7")
      : (dark ? "#999" : "#666"),
    transition: "all 0.15s",
  };
}
