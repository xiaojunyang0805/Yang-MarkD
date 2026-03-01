import { forwardRef } from 'react';

const ContentView = forwardRef(function ContentView(
  { showRaw, markdown, renderedHtml, fontSize },
  ref
) {
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
            style={{ fontSize }}
          />
        )}
      </div>
    </div>
  );
});

export default ContentView;
