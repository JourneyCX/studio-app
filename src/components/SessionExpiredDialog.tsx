interface Props {
  onReload: () => void
}

export function SessionExpiredDialog({ onReload }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: '32px 28px 24px',
        maxWidth: 420,
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Icon */}
        <div style={{ fontSize: 36, textAlign: 'center', lineHeight: 1 }}>🔒</div>

        {/* Title */}
        <h2 style={{
          margin: 0, textAlign: 'center',
          fontSize: 18, fontWeight: 700, color: '#0f172a',
        }}>
          Session Expired
        </h2>

        {/* Body */}
        <p style={{
          margin: 0, textAlign: 'center',
          fontSize: 14, color: '#475569', lineHeight: 1.6,
        }}>
          Your editing session has timed out for security. Any changes made since your last successful save or publish were not saved.
          Reload to get a fresh session and continue editing.
        </p>

        {/* Action */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={onReload}
            style={{
              width: '100%',
              padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              backgroundColor: '#0ea5e9',
              color: '#fff', fontSize: 14, fontWeight: 600,
            }}
          >
            Reload Editor
          </button>
        </div>
      </div>
    </div>
  )
}
