import { useSyncExternalStore } from 'react'

// B2B Session 4: "Preview as" for the editor. The live storefront (nuxt-storefront) shows a different price and buy
// button depending on who is looking: a retail visitor, a Shop window visitor (no price or the retail price, and no
// buy button) or a signed-in trade buyer (trade price, buying not offered until trade checkout exists). The editor has
// no real visitor, so this is a preview-only switch that never changes saved content.
//
//   retail        default: exactly what the editor always showed
//   window-hidden Shop window mode, price hidden: "Log in for trade prices", no buy button
//   window-retail Shop window mode, retail price shown labelled "Retail price", no buy button
//   trade         signed-in trade buyer: a trade price (sample) excl. VAT label, buying note instead of the buy button

export type PreviewBuyer = 'retail' | 'window-hidden' | 'window-retail' | 'trade'

const KEY = 'studio.previewBuyer'
const VALID: PreviewBuyer[] = ['retail', 'window-hidden', 'window-retail', 'trade']
const listeners = new Set<() => void>()

function read(): PreviewBuyer {
  try {
    const v = window.localStorage.getItem(KEY) as PreviewBuyer | null
    return v && VALID.includes(v) ? v : 'retail'
  } catch {
    return 'retail'
  }
}

let current: PreviewBuyer = typeof window === 'undefined' ? 'retail' : read()

export function setPreviewBuyer(v: PreviewBuyer): void {
  current = v
  try { window.localStorage.setItem(KEY, v) } catch { /* preview-only; losing it is fine */ }
  listeners.forEach(l => l())
}

export function usePreviewBuyer(): PreviewBuyer {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => current,
    () => 'retail' as PreviewBuyer,
  )
}

/** What the preview shows in place of the price, or null for the normal price text. */
export function previewPriceText(buyer: PreviewBuyer, base: string): string {
  switch (buyer) {
    case 'window-hidden': return 'Log in for trade prices'
    case 'window-retail': return `${base} (Retail price)`
    case 'trade':         return `${base} excl. VAT`
    default:              return base
  }
}

/** Whether the preview offers a buy button at all (never for Shop window visitors; not yet for trade buyers). */
export function previewBuyOffered(buyer: PreviewBuyer): boolean {
  return buyer === 'retail'
}

export function previewBuyNote(buyer: PreviewBuyer): string {
  return buyer === 'trade'
    ? 'Trade ordering is opening soon.'
    : 'Buying is for trade accounts. Log in, or apply for a trade account.'
}

export const PREVIEW_BUYER_OPTIONS: { value: PreviewBuyer; label: string }[] = [
  { value: 'retail',        label: 'Retail visitor' },
  { value: 'window-hidden', label: 'Shop window visitor (no price)' },
  { value: 'window-retail', label: 'Shop window visitor (retail price)' },
  { value: 'trade',         label: 'Signed-in trade buyer' },
]
