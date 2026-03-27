import { forwardRef, useCallback } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';

const ContentView = forwardRef(function ContentView(
  { showRaw, markdown, renderedHtml, fontSize },
  ref
) {
  const handleClick = useCallback((e) => {
    const link = e.target.closest('a[data-external-link]');
    if (!link) return;
    e.preventDefault();
    const href = link.getAttribute('href');
    if (href) {
      openUrl(href);
    }
  }, []);

  return (
    <div ref={ref} className="content-area">
      <div className="content-inner">
        {showRaw ? (
          <pre className="raw-view" style={{ fontSize: fontSize - 2 }}>
            {markdown}
          </pre>
        ) : (
          <div
            className="md-content"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
            onClick={handleClick}
            style={{ fontSize }}
          />
        )}
      </div>
    </div>
  );
});

export default ContentView;
