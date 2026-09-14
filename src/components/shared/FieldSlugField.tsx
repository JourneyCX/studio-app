import { useItemCustomFields } from '../../lib/hooks/useItemCustomFields'

// Puck 'custom' field for ProductTabs — lets a theme designer pick a real,
// already-defined Warehouse item Custom Field (Setup > Custom Fields,
// "belongs to" = Items) by name, instead of hand-typing its slug (which
// would silently break a tab if mistyped — the live storefront looks values
// up by exact slug match, see nuxt-storefront/components/storefront/
// ProductTabs.vue). Keeps the stored value as the field's slug either way,
// so it round-trips cleanly through Puck's own JSON page state.
export function FieldSlugField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { status, fields } = useItemCustomFields()

  // The saved slug may point at a field that's since been renamed/deleted —
  // keep it selectable (as its raw slug) rather than silently discarding the
  // page author's choice the moment the dropdown re-fetches.
  const hasCurrentValue = value && fields.some(f => f.slug === value)

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 4 }}
    >
      <option value="">
        {status === 'loading' ? 'Loading fields…' : status === 'error' ? 'Could not load fields' : 'Select a field…'}
      </option>
      {value && !hasCurrentValue && (
        <option value={value}>{value} (not found)</option>
      )}
      {fields.map(f => (
        <option key={f.id} value={f.slug}>{f.name}</option>
      ))}
    </select>
  )
}
