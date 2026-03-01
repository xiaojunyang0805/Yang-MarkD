export default function TableOfContents({ headings, onScrollTo }) {
  return (
    <div className="toc-sidebar">
      <div className="toc-title">Contents</div>
      {headings.map((h, i) => (
        <div
          key={i}
          className={`toc-item toc-level-${h.level}`}
          onClick={() => onScrollTo(h.id)}
        >
          {h.text}
        </div>
      ))}
    </div>
  );
}
