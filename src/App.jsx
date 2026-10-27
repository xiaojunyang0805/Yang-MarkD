import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import TableOfContents from './components/TableOfContents';
import ContentView from './components/ContentView';
import DropOverlay from './components/DropOverlay';
import { useFileHandler } from './hooks/useFileHandler';
import { renderMarkdown, setBaseDir, applyLocalImages } from './lib/markdown';
import { extractHeadings, wordCount } from './lib/utils';
import { SAMPLE_MD } from './sample';

export default function App() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [fileName, setFileName] = useState('welcome.md');
  const [theme, setTheme] = useState('light');
  const [tocOpen, setTocOpen] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [showRaw, setShowRaw] = useState(false);
  const [baseDir, setBaseDirState] = useState('');
  // filePath -> blob URL ('' when the file could not be read)
  const [imageCache, setImageCache] = useState({});
  const contentRef = useRef(null);

  const headings = extractHeadings(markdown);
  const stats = wordCount(markdown);
  // Local image URLs are baked into the HTML string so that re-renders
  // (font size, TOC toggle, theme) which reset innerHTML keep the images.
  const baseHtml = useMemo(() => renderMarkdown(markdown), [markdown, baseDir]);
  const { html: renderedHtml, missing: missingImages } = useMemo(
    () => applyLocalImages(baseHtml, baseDir, imageCache),
    [baseHtml, baseDir, imageCache]
  );

  const onFileLoaded = useCallback((content, name, filePath) => {
    setMarkdown(content);
    setFileName(name);
    const dir = filePath ? filePath.replace(/[/\\][^/\\]*$/, '') : '';
    setBaseDir(dir);
    setBaseDirState(dir);
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
  const missingKey = missingImages.join('|');
  useEffect(() => {
    if (missingImages.length === 0) return;
    const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp' };
    (async () => {
      let readFile = null;
      try {
        ({ readFile } = await import('@tauri-apps/plugin-fs'));
      } catch {
        // Not in Tauri env
      }
      const loaded = {};
      for (const filePath of missingImages) {
        try {
          const ext = filePath.split('.').pop().toLowerCase();
          const mime = mimeTypes[ext] || 'application/octet-stream';
          const data = await readFile(filePath);
          loaded[filePath] = URL.createObjectURL(new Blob([data], { type: mime }));
        } catch {
          // Image file not found or unreadable — remember so we don't retry
          loaded[filePath] = '';
        }
      }
      setImageCache((prev) => {
        const next = { ...prev };
        for (const [path, url] of Object.entries(loaded)) {
          if (path in next) {
            if (url) URL.revokeObjectURL(url); // already loaded by a concurrent run
          } else {
            next[path] = url;
          }
        }
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey]);

  // Release blob URLs when a different folder's file is opened
  useEffect(() => {
    return () => {
      setImageCache((prev) => {
        Object.values(prev).forEach((url) => url && URL.revokeObjectURL(url));
        return {};
      });
    };
  }, [baseDir]);

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
