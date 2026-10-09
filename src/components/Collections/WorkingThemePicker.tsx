import { useEffect, useState } from 'react'
import { stratumApi, getWorkingThemeId, setWorkingThemeId, type StoreThemeOption } from '../../lib/api'

// "Working on theme" — tells the editor which theme the page being built is for,
// so theme-owned lists (Collection List / Carousel, collection pickers) show only
// that theme's items. See docs/specs/theme-ownership-isolation.md. "No theme" =
// a merchant editing their own live store: everything, as before.
export function WorkingThemePicker() {
  const [themes, setThemes] = useState<StoreThemeOption[]>([])
  const [value, setValue]   = useState<number>(getWorkingThemeId())

  useEffect(() => {
    let cancelled = false
    stratumApi.getActiveCollectionThemes()
      .then(r => { if (!cancelled) setThemes(r.themes ?? []) })
      .catch(() => { /* picker just stays empty; editor keeps working unscoped */ })
    return () => { cancelled = true }
  }, [])

  // Nothing to choose between (a merchant store with no themes to build): hide.
  if (themes.length === 0) return null

  return (
    <label
      title="Which theme this page is for. Collection lists show only that theme's collections."
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}
    >
      <span>Working on theme</span>
      <select
        value={value || ''}
        onChange={e => { const id = Number(e.target.value) || 0; setValue(id); setWorkingThemeId(id) }}
        style={{ fontSize: 12, padding: '4px 6px', borderRadius: 5, border: '1px solid #cbd5e1', maxWidth: 180 }}
      >
        <option value="">None (all collections)</option>
        {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </label>
  )
}
