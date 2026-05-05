interface SearchHighlightProps {
  text: string;
}

export default function SearchHighlight({ text }: SearchHighlightProps) {
  const parts = text.split(/(<em>|<\/em>)/);

  return (
    <span>
      {parts.map((part, i) => {
        if (part === '<em>') return null;
        if (part === '</em>') return null;

        const openBefore = parts.slice(0, i).filter((p) => p === '<em>').length;
        const closeBefore = parts.slice(0, i).filter((p) => p === '</em>').length;
        const isHighlighted = openBefore > closeBefore;

        if (isHighlighted) {
          return (
            <span
              key={i}
              style={{
                color: 'var(--color-accent)',
                fontWeight: 'var(--font-semibold)',
              }}
            >
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
