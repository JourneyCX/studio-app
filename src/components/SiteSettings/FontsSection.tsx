// Placeholder for this phase — Fonts is the one section with no existing data to
// surface (every other tab is a new UI on columns sb_site_settings already has).
// Needs real rendering infrastructure (webfont loading + a shared CSS variable both
// renderers read) that doesn't exist yet — see docs/studio_site_settings_panel_spec.md.
export function FontsSection() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔤</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Fonts</div>
      <div style={{ fontSize: 13, maxWidth: 320, margin: '0 auto' }}>
        Coming soon — pick a typeface for your storefront's headings and body text.
      </div>
    </div>
  )
}
