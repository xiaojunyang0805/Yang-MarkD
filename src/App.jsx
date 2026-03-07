import { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import TableOfContents from './components/TableOfContents';
import ContentView from './components/ContentView';
import DropOverlay from './components/DropOverlay';
import { useFileHandler } from './hooks/useFileHandler';
import { renderMarkdown, setBaseDir } from './lib/markdown';
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

  const onFileLoaded = useCallback((content, name, filePath) => {
    setMarkdown(content);
    setFileName(name);
    if (filePath) {
      const dir = filePath.replace(/[/\\][^/\\]*$/, '');
      setBaseDir(dir);
    } else {
      setBaseDir('');
    }
  }, []);

  const { isDragging, fileInputRef, onDragOver, onDragLeave, onDrop, onInputChange, openFilePicker } =
    useFileHandler(onFileLoaded);

  const openFile = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      const selected = await open({
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
      });
      if (selected) {
        const content = await readTextFile(selected);
        const name = selected.replace(/.*[/\\]/, '');
        onFileLoaded(content, name, selected);
      }
    } catch {
      // Not in Tauri env — fall back to web file picker
      openFilePicker();
    }
  }, [onFileLoaded, openFilePicker]);

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
        onFileLoaded(content, name, filePath);
      } catch {
        // Not in Tauri env or no CLI arg — keep sample content
      }
    })();
  }, [onFileLoaded]);

  // Handle Tauri drag-drop events (provides full file paths)
  useEffect(() => {
    let unlisten;
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        unlisten = await getCurrentWindow().onDragDropEvent(async (event) => {
          if (event.payload.type === 'drop') {
            const path = event.payload.paths.find((p) => {
              const lower = p.toLowerCase();
              return lower.endsWith('.md') || lower.endsWith('.markdown');
            });
            if (path) {
              const content = await readTextFile(path);
              const name = path.replace(/.*[/\\]/, '');
              onFileLoaded(content, name, path);
            }
          }
        });
      } catch {
        // Not in Tauri env
      }
    })();
    return () => { unlisten?.(); };
  }, [onFileLoaded]);

  // Load local images referenced in markdown via Tauri fs
  useEffect(() => {
    if (!contentRef.current) return;
    const images = contentRef.current.querySelectorAll('img[data-file-path]');
    if (images.length === 0) return;
    const blobUrls = [];
    const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp' };
    (async () => {
      try {
        const { readFile } = await import('@tauri-apps/plugin-fs');
        for (const img of images) {
          try {
            const filePath = img.dataset.filePath;
            const ext = filePath.split('.').pop().toLowerCase();
            const mime = mimeTypes[ext] || 'application/octet-stream';
            const data = await readFile(filePath);
            const blob = new Blob([data], { type: mime });
            const url = URL.createObjectURL(blob);
            blobUrls.push(url);
            img.src = url;
          } catch {
            // Image file not found or unreadable
          }
        }
      } catch {
        // Not in Tauri env
      }
    })();
    return () => blobUrls.forEach(URL.revokeObjectURL);
  }, [renderedHtml]);

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
        onOpenFile={openFile}
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
