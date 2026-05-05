interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        animation: 'fadeIn 0.3s ease both',
      }}
    >
      <span
        style={{
          fontSize: 48,
          lineHeight: 1,
          marginBottom: 'var(--space-4)',
          filter: 'grayscale(0.3)',
        }}
      >
        {icon}
      </span>
      <h3
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          marginBottom: description ? 'var(--space-2)' : 0,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            maxWidth: 320,
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
