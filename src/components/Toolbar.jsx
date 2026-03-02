export default function Toolbar({
  fileName,
  stats,
  tocOpen,
  onToggleToc,
  fontSize,
  onFontDecrease,
  onFontIncrease,
  showRaw,
  onToggleRaw,
  theme,
  onToggleTheme,
  onExportPdf,
  onOpenFile,
}) {
  const dark = theme === 'dark';

  return (
    <div className="toolbar">
      <button
        className={`btn${tocOpen ? ' active' : ''}`}
        onClick={onToggleToc}
        title="Toggle Table of Contents"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 4h12M2 8h8M2 12h10" />
        </svg>
      </button>

      <div className="toolbar-filename">{fileName}</div>

      <div className="toolbar-stats">
        <span>{stats.words} words</span>
        <span className="toolbar-stats-sep">&middot;</span>
        <span>{stats.readTime} min read</span>
      </div>

      <button
        className="btn"
        onClick={onFontDecrease}
        title="Decrease font size"
      >
        A−
      </button>
      <button
        className="btn"
        onClick={onFontIncrease}
        title="Increase font size"
      >
        A+
      </button>

      <button
        className={`btn${showRaw ? ' active' : ''}`}
        onClick={onToggleRaw}
        title="Toggle raw markdown"
      >
        {showRaw ? 'Rich' : 'Raw'}
      </button>

      <button
        className="btn"
        onClick={onExportPdf}
        title="Export as PDF"
      >
        PDF
      </button>

      <button
        className="btn"
        onClick={onToggleTheme}
        title="Toggle theme"
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <button className="btn btn-primary" onClick={onOpenFile}>
        Open File
      </button>
    </div>
  );
}
