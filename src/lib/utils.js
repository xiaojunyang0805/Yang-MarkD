export function extractHeadings(md) {
  if (!md) return [];
  const headings = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    });
  }
  return headings;
}

export function wordCount(md) {
  if (!md) return { words: 0, chars: 0, lines: 0, readTime: 0 };
  const text = md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_`>\[\]()!|]/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return {
    words,
    chars: md.length,
    lines: md.split('\n').length,
    readTime: Math.max(1, Math.ceil(words / 200)),
  };
}
