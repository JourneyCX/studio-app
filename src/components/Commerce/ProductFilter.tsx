import { useEffect, useState } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { CategoryFilterListField } from '../shared/CategoryFilterListField'

type Category = { label: string; slug: string; count: number }

// Puck's canvas renders every block inside a single iframe document, but Puck
// gives independent blocks like ProductFilter/ProductGrid no shared state or
// prop channel to talk to each other with — so the filter widget broadcasts its
// selection on the iframe's own `window` and ProductGrid listens for it (see
// ProductGrid.tsx). Scoped to this one event name/shape only.
export const PRODUCT_FILTER_EVENT = 'stratum:product-filter'
export type ProductFilterEventDetail = { categorySlugs: string[]; maxPrice?: number }

export type ProductFilterProps = {
  layout: 'sidebar' | 'topbar'
  showSearch: boolean
  showCategories: boolean
  showCategoryCounts: boolean
  showPriceRange: boolean
  showSortBy: boolean
  showActiveFilters: boolean
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  currency: string
  minPrice: number
  maxPrice: number
  categories: Category[]
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

function SearchIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SectionHeader({ title, open, onToggle, textColor }: { title: string; open: boolean; onToggle: () => void; textColor: string }) {
  return (
    <button
      onClick={onToggle}
      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', color: textColor }}
    >
      <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
      <span style={{ fontSize: 18, fontWeight: 300, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
    </button>
  )
}

interface InnerProps extends ProductFilterProps {}

function FilterPanel({ layout, showSearch, showCategories, showCategoryCounts, showPriceRange, showSortBy, showActiveFilters, accentColor, backgroundColor, textColor, borderColor, currency, minPrice, maxPrice, categories }: InnerProps) {
  const [catOpen, setCatOpen]     = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [checkedCats, setChecked] = useState<number[]>([0])
  const [priceVal, setPriceVal]   = useState(maxPrice)

  useEffect(() => {
    const categorySlugs = showCategories
      ? checkedCats.map(i => categories[i]?.slug).filter((s): s is string => !!s)
      : []
    const detail: ProductFilterEventDetail = {
      categorySlugs,
      maxPrice: showPriceRange ? priceVal : undefined,
    }
    window.dispatchEvent(new CustomEvent<ProductFilterEventDetail>(PRODUCT_FILTER_EVENT, { detail }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedCats, priceVal, showCategories, showPriceRange, categories])

  const inputBase: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 14,
    color: textColor,
    backgroundColor: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const divider = <hr style={{ border: 'none', borderTop: `1px solid ${borderColor}`, margin: '4px 0' }} />

  const filterBody = (
    <div>
      {showActiveFilters && checkedCats.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {checkedCats.map((i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: accentColor + '18', color: accentColor, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}>
              {categories[i]?.label}
              <button onClick={() => setChecked(checkedCats.filter((c) => c !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accentColor, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {showSearch && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ position: 'absolute', left: 10 }}><SearchIcon color={textColor + '88'} /></div>
          <input type="text" placeholder="Search products…" style={{ ...inputBase, paddingLeft: 34 }} readOnly />
        </div>
      )}

      {showSortBy && (
        <div style={{ marginBottom: 16 }}>
          <select style={{ ...inputBase, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', cursor: 'pointer' }}>
            <option>Sort: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest Arrivals</option>
            <option>Best Selling</option>
          </select>
        </div>
      )}

      {showCategories && categories.length > 0 && (
        <div>
          {divider}
          <SectionHeader title="Category" open={catOpen} onToggle={() => setCatOpen(!catOpen)} textColor={textColor} />
          {catOpen && (
            <div style={{ paddingBottom: 8 }}>
              {categories.map((cat, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checkedCats.includes(i)}
                    onChange={() => setChecked(checkedCats.includes(i) ? checkedCats.filter((c) => c !== i) : [...checkedCats, i])}
                    style={{ accentColor, width: 15, height: 15, cursor: 'pointer' }}
                  />
                  <span style={{ color: textColor, fontSize: 14, flexGrow: 1 }}>{cat.label}</span>
                  {showCategoryCounts && <span style={{ color: textColor, opacity: 0.45, fontSize: 12 }}>{cat.count}</span>}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {showPriceRange && (
        <div>
          {divider}
          <SectionHeader title="Price" open={priceOpen} onToggle={() => setPriceOpen(!priceOpen)} textColor={textColor} />
          {priceOpen && (
            <div style={{ paddingBottom: 12 }}>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                value={priceVal}
                onChange={(e) => setPriceVal(Number(e.target.value))}
                style={{ width: '100%', accentColor, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ color: textColor, opacity: 0.65, fontSize: 13 }}>{currency}{minPrice}</span>
                <span style={{ color: accentColor, fontWeight: 700, fontSize: 13 }}>{currency}{priceVal}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (layout === 'topbar') {
    return (
      <div style={{ backgroundColor, padding: '14px 24px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textColor, fontWeight: 700, fontSize: 14 }}>
            <FilterIcon />
            <span>Filters</span>
          </div>
          {showSearch && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 200px', maxWidth: 280 }}>
              <div style={{ position: 'absolute', left: 10 }}><SearchIcon color={textColor + '88'} /></div>
              <input type="text" placeholder="Search…" style={{ ...inputBase, paddingLeft: 34 }} readOnly />
            </div>
          )}
          {showCategories && categories.slice(0, 5).map((cat, i) => (
            <button
              key={i}
              onClick={() => setChecked(checkedCats.includes(i) ? checkedCats.filter((c) => c !== i) : [...checkedCats, i])}
              style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${checkedCats.includes(i) ? accentColor : borderColor}`, backgroundColor: checkedCats.includes(i) ? accentColor + '14' : '#fff', color: checkedCats.includes(i) ? accentColor : textColor }}
            >
              {cat.label}
            </button>
          ))}
          {showPriceRange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ color: textColor, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Up to {currency}{priceVal}</span>
              <input type="range" min={minPrice} max={maxPrice} value={priceVal} onChange={(e) => setPriceVal(Number(e.target.value))} style={{ width: 100, accentColor, cursor: 'pointer' }} />
            </div>
          )}
          {showSortBy && (
            <select style={{ ...inputBase, width: 'auto', paddingRight: 32, cursor: 'pointer' }}>
              <option>Sort: Featured</option>
              <option>Price: Low to High</option>
              <option>Newest</option>
            </select>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor, padding: '24px', borderRight: `1px solid ${borderColor}`, minWidth: 220, maxWidth: 260 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textColor, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
        <FilterIcon />
        <span>Filters</span>
      </div>
      {filterBody}
    </div>
  )
}

export const ProductFilter: ComponentConfig<ProductFilterProps> = {
  label: 'Product Filter',
  fields: {
    layout:            { type: 'select', label: 'Layout', options: [{ label: 'Sidebar (vertical panel)', value: 'sidebar' }, { label: 'Top Bar (horizontal strip)', value: 'topbar' }] },
    showSearch:        { type: 'radio',  label: 'Search Box', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showCategories:    { type: 'radio',  label: 'Category Filter', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showCategoryCounts: { type: 'radio', label: 'Category Counts', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showPriceRange:    { type: 'radio',  label: 'Price Range Slider', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showSortBy:        { type: 'radio',  label: 'Sort By Dropdown', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    showActiveFilters: { type: 'radio',  label: 'Active Filter Tags', options: [{ label: 'Show', value: true }, { label: 'Hide', value: false }] },
    accentColor:       { type: 'text',   label: 'Accent Colour (hex)' },
    backgroundColor:   { type: 'text',  label: 'Background Colour (hex)' },
    textColor:         { type: 'text',   label: 'Text Colour (hex)' },
    borderColor:       { type: 'text',   label: 'Border Colour (hex)' },
    currency:          { type: 'text',   label: 'Currency Symbol' },
    minPrice:          { type: 'number', label: 'Min Price' },
    maxPrice:          { type: 'number', label: 'Max Price' },
    categories: {
      type: 'custom',
      label: 'Categories',
      render: ({ value, onChange }) => (
        <CategoryFilterListField value={value as Category[]} onChange={onChange as (v: Category[]) => void} />
      ),
    },
  },
  defaultProps: {
    layout:            'sidebar',
    showSearch:        true,
    showCategories:    true,
    showCategoryCounts: false,
    showPriceRange:    true,
    showSortBy:        true,
    showActiveFilters: true,
    accentColor:       '#2563eb',
    backgroundColor:   '#ffffff',
    textColor:         '#1e293b',
    borderColor:       '#e2e8f0',
    currency:          'R ',
    minPrice:          0,
    maxPrice:          2000,
    // No slug on these placeholder defaults — they're display-only until a
    // merchant picks real categories via the dropdown, at which point real
    // slugs are set and filtering activates.
    categories: [
      { label: 'All Products', slug: '', count: 124 },
      { label: 'New Arrivals', slug: '', count: 32 },
      { label: 'Best Sellers', slug: '', count: 48 },
      { label: 'Sale', slug: '', count: 21 },
      { label: 'Clothing', slug: '', count: 56 },
      { label: 'Accessories', slug: '', count: 38 },
    ],
  },
  render(props) {
    return <FilterPanel {...props} />
  },
}
