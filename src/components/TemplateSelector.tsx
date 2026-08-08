import { useState } from 'react'
import type { Data } from '@measured/puck'
import type { StoreTemplate, TemplateCategory } from '@/types/templates'
import { TEMPLATE_CATEGORY_OPTIONS } from '@/types/templates'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TemplateSelectorProps {
  templates: StoreTemplate[]
  loadingPersonal: boolean
  applying: string | null
  currentPuckData: Data
  savingAsTemplate: boolean
  onApply: (template: StoreTemplate) => void
  onSaveAsTemplate: (puckData: Data, name: string, category: TemplateCategory) => void
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Root modal
// ---------------------------------------------------------------------------
export function TemplateSelector({
  templates,
  loadingPersonal,
  applying,
  currentPuckData,
  savingAsTemplate,
  onApply,
  onSaveAsTemplate,
  onClose,
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | TemplateCategory>('all')
  const [confirmId,      setConfirmId]      = useState<string | null>(null)
  const [saveFormOpen,   setSaveFormOpen]   = useState(false)
  const [saveName,       setSaveName]       = useState('')
  const [saveCategory,   setSaveCategory]   = useState<TemplateCategory>('general')

  const filtered =
    activeCategory === 'all'
      ? templates
      : templates.filter(t => t.category === activeCategory)

  // Two-click confirmation: first click arms, second click fires.
  // confirmId is intentionally NOT reset here on the second click — the card
  // stays in confirming state so the user sees "Applying…" feedback while the
  // API call is in flight. The modal closes on success (unmounting this component
  // and resetting state), or the user can Cancel on error.
  const handleApplyClick = (template: StoreTemplate) => {
    if (confirmId === template.id) {
      onApply(template)
    } else {
      setConfirmId(template.id)
    }
  }

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!saveName.trim()) return
    onSaveAsTemplate(currentPuckData, saveName.trim(), saveCategory)
    setSaveFormOpen(false)
    setSaveName('')
  }

  return (
    // Backdrop — clicking outside closes the modal
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 980,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.32)',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: '#0f172a' }}>
              Store Templates
            </h2>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Pick a template to get started — you can personalise every colour, image, and
              text inside the editor after applying.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
              fontSize: 18,
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* ── Category tabs ── */}
        <div
          style={{
            padding: '0 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {TEMPLATE_CATEGORY_OPTIONS.map(opt => {
            const active = activeCategory === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setActiveCategory(opt.value as 'all' | TemplateCategory)
                  setConfirmId(null)
                }}
                style={{
                  padding: '11px 15px',
                  border: 'none',
                  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: active ? '#2563eb' : '#64748b',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  marginBottom: -1,
                  transition: 'color 0.15s',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* ── Template grid ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
          {filtered.length === 0 && !loadingPersonal ? (
            <EmptyState />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 18,
              }}
            >
              {filtered.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isApplying={applying === template.id}
                  isConfirming={confirmId === template.id}
                  onApplyClick={() => handleApplyClick(template)}
                  onCancelConfirm={() => setConfirmId(null)}
                />
              ))}
              {loadingPersonal && <LoadingCard />}
            </div>
          )}
        </div>

        {/* ── Footer: Save as My Template ── */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#fafafa',
            flexShrink: 0,
          }}
        >
          {saveFormOpen ? (
            <form
              onSubmit={handleSaveSubmit}
              style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
            >
              <input
                type="text"
                placeholder="Template name"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                required
                autoFocus
                style={{
                  flex: '1 1 190px',
                  padding: '8px 13px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  color: '#0f172a',
                }}
              />
              <select
                value={saveCategory}
                onChange={e => setSaveCategory(e.target.value as TemplateCategory)}
                style={{
                  padding: '8px 13px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                }}
              >
                {TEMPLATE_CATEGORY_OPTIONS.filter(o => o.value !== 'all').map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={savingAsTemplate}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {savingAsTemplate ? 'Saving…' : 'Save Template'}
              </button>
              <button
                type="button"
                onClick={() => { setSaveFormOpen(false); setSaveName('') }}
                style={{
                  padding: '8px 13px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                Applying a template replaces your current layout — no data is permanently lost until
                you publish.
              </p>
              <button
                onClick={() => setSaveFormOpen(true)}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                💾 Save Current Page as Template
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------
interface TemplateCardProps {
  template: StoreTemplate
  isApplying: boolean
  isConfirming: boolean
  onApplyClick: () => void
  onCancelConfirm: () => void
}

function TemplateCard({
  template,
  isApplying,
  isConfirming,
  onApplyClick,
  onCancelConfirm,
}: TemplateCardProps) {
  return (
    <div
      style={{
        border: `1px solid ${isConfirming ? '#2563eb' : '#e2e8f0'}`,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isConfirming ? '0 0 0 3px rgba(37,99,235,0.18)' : 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9',
        }}
      >
        {template.thumbnail ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              color: '#cbd5e1',
            }}
          >
            🖼
          </div>
        )}
        {template.isPersonal && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#7c3aed',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 20,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            My Template
          </span>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          padding: '13px 15px 6px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {template.name}
          </h3>
          <span
            style={{
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              marginTop: 2,
              textTransform: 'capitalize',
              flexShrink: 0,
            }}
          >
            {template.category}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>
          {template.description}
        </p>
        {template.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 4 }}>
            {template.tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  backgroundColor: '#f8fafc',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid #f1f5f9',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ padding: '10px 15px 15px', display: 'flex', gap: 7 }}>
        {isConfirming ? (
          <>
            <button
              onClick={onApplyClick}
              disabled={isApplying}
              style={{
                flex: 1,
                padding: '9px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: isApplying ? 'default' : 'pointer',
                opacity: isApplying ? 0.75 : 1,
              }}
            >
              {isApplying ? 'Applying…' : '✓ Yes, Apply Template'}
            </button>
            {!isApplying && (
              <button
                onClick={onCancelConfirm}
                style={{
                  padding: '9px 11px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onApplyClick}
            disabled={isApplying}
            style={{
              flex: 1,
              padding: '9px',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: isApplying ? 'default' : 'pointer',
              opacity: isApplying ? 0.6 : 1,
            }}
          >
            {isApplying ? 'Applying…' : 'Apply Template'}
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty / loading states
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '52px 24px',
        color: '#94a3b8',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <p style={{ fontSize: 15, margin: 0 }}>No templates found for this category.</p>
    </div>
  )
}

function LoadingCard() {
  return (
    <div
      style={{
        border: '1px dashed #e2e8f0',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
        color: '#94a3b8',
        fontSize: 13,
      }}
    >
      Loading personal templates…
    </div>
  )
}
