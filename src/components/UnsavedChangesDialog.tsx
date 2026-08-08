interface Props {
  saving: boolean
  onSaveAndExit: () => void
  onExitWithoutSaving: () => void
  onKeepEditing: () => void
}

export function UnsavedChangesDialog({ saving, onSaveAndExit, onExitWithoutSaving, onKeepEditing }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
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
        <div style={{ fontSize: 36, textAlign: 'center', lineHeight: 1 }}>⚠️</div>

        {/* Title */}
        <h2 style={{
          margin: 0, textAlign: 'center',
          fontSize: 18, fontWeight: 700, color: '#0f172a',
        }}>
          Unsaved Changes
        </h2>

        {/* Body */}
        <p style={{
          margin: 0, textAlign: 'center',
          fontSize: 14, color: '#475569', lineHeight: 1.6,
        }}>
          You have changes that haven't been saved yet. If you leave now they will be lost.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {/* Primary: save and exit */}
          <button
            disabled={saving}
            onClick={onSaveAndExit}
            style={{
              padding: '10px 0', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              backgroundColor: saving ? '#94a3b8' : '#0ea5e9',
              color: '#fff', fontSize: 14, fontWeight: 600,
            }}
          >
            {saving ? 'Saving…' : 'Save Draft & Exit'}
          </button>

          {/* Secondary: discard and exit */}
          <button
            disabled={saving}
            onClick={onExitWithoutSaving}
            style={{
              padding: '10px 0', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
              border: '1px solid #fca5a5',
              backgroundColor: '#fff', color: '#dc2626',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Exit Without Saving
          </button>

          {/* Tertiary: stay */}
          <button
            disabled={saving}
            onClick={onKeepEditing}
            style={{
              padding: '10px 0', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc', color: '#334155',
              fontSize: 14, fontWeight: 600,
            }}
          >
            Keep Editing
          </button>
        </div>
      </div>
    </div>
  )
}
