import { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import TableOfContents from './components/TableOfContents';
import ContentView from './components/ContentView';
import DropOverlay from './components/DropOverlay';
import { useFileHandler } from './hooks/useFileHandler';
import { renderMarkdown } from './lib/markdown';
import { extractHeadings, wordCount } from './lib/utils';
import { SAMPLE_MD } from './sample';

export default function App() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [fileName, setFileName] = useState('welcome.md');
  const [theme, setTheme] = useState('light');
  const [tocOpen, setTocOpen] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [showRaw, setShowRaw] = useState(false);
  const contentRef = useRef(null);

  const headings = extractHeadings(markdown);
  const stats = wordCount(markdown);
  const renderedHtml = renderMarkdown(markdown);

  const onFileLoaded = useCallback((content, name) => {
    setMarkdown(content);
    setFileName(name);
  }, []);

  const { isDragging, fileInputRef, onDragOver, onDragLeave, onDrop, onInputChange, openFilePicker } =
    useFileHandler(onFileLoaded);

  // Load file passed via CLI argument (e.g. double-click file association)
  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const filePath = await invoke('get_cli_file_path');
        if (!filePath) return;
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const content = await readTextFile(filePath);
        const name = filePath.replace(/.*[/\\]/, '');
        onFileLoaded(content, name);
      } catch {
        // Not in Tauri env or no CLI arg — keep sample content
      }
    })();
  }, [onFileLoaded]);

  const scrollToHeading = (id) => {
    const el = contentRef.current?.querySelector(`[data-heading-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const exportPdf = useCallback(() => {
    const firstHeading = headings.find((h) => h.level === 1);
    const title = firstHeading?.text || fileName.replace(/\.[^.]+$/, '');
    const prev = document.title;
    document.title = title;
    window.print();
    document.title = prev;
  }, [headings, fileName]);

  // Apply theme to document
  document.documentElement.dataset.theme = theme;

  return (
    <div
      className="app-root"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && <DropOverlay />}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />

      <Toolbar
        fileName={fileName}
        stats={stats}
        tocOpen={tocOpen}
        onToggleToc={() => setTocOpen(!tocOpen)}
        fontSize={fontSize}
        onFontDecrease={() => setFontSize((f) => Math.max(12, f - 1))}
        onFontIncrease={() => setFontSize((f) => Math.min(24, f + 1))}
        showRaw={showRaw}
        onToggleRaw={() => setShowRaw(!showRaw)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onExportPdf={exportPdf}
        onOpenFile={openFilePicker}
      />

      <div className="main-area">
        {tocOpen && headings.length > 0 && (
          <TableOfContents headings={headings} onScrollTo={scrollToHeading} />
        )}

        <ContentView
          ref={contentRef}
          showRaw={showRaw}
          markdown={markdown}
          renderedHtml={renderedHtml}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
}
