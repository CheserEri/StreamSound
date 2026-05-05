interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)' as unknown as number,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          maxWidth: 400,
          width: '90%',
          boxShadow: 'var(--shadow-xl)',
          animation: 'scaleIn 0.25s ease both',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-error-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: 24 }}>&#x26A0;</span>
        </div>
        <h3
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--color-text)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Error
        </h3>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            marginBottom: 'var(--space-6)',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className="btn btn-primary btn-block"
        >
          OK
        </button>
      </div>
    </div>
  );
}
