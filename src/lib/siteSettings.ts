// Single source of truth for Header/Footer chrome + site-wide branding — one row per
// tenant (sb_site_settings), replacing the old per-page SiteHeader/SiteFooter Puck
// components. See docs/site_settings_architecture_investigation.md. Field names match
// nuxt-storefront/server/utils/stratum.ts's SiteSettings interface — keep both in sync.

export interface SiteSettings {
  logoUrl: string | null
  logoAlt: string | null
  logoText: string | null
  faviconUrl: string | null
  businessName: string | null
  tagline: string | null
  description: string | null
  contactPhone: string | null
  contactEmail: string | null
  contactAddress: string | null
  socialLinks: { platform: string; url: string }[]
  // children = one level of dropdown nesting, derived server-side from the
  // Pages panel's menu tree (Store_builder_model::build_nav_links()) — a
  // top-level entry with no children renders as a plain link.
  navLinks: { label: string; url: string; children?: { label: string; url: string }[] }[]
  headerBackgroundColor: string | null
  headerTextColor: string | null
  headerAccentColor: string | null
  headerSticky: boolean
  headerCtaText: string | null
  headerCtaUrl: string | null
  footerBackgroundColor: string | null
  footerTextColor: string | null
  footerAccentColor: string | null
  footerCopyrightText: string | null
  footerColumns: { heading: string; links: { label: string; url: string }[] }[]
  whatsappEnabled: boolean
  whatsappPopupEnabled: boolean
  whatsappPhone: string | null
  whatsappMessageTitle: string | null
  whatsappMessageBody: string | null
  whatsappButtonColor: string | null
  announcementEnabled: boolean
  announcementMessage: string | null
  announcementMode: 'static' | 'scroll'
  announcementBgColor: string | null
  announcementTextColor: string | null
  announcementLinkUrl: string | null
  announcementSpeed: number
}

// Graceful defaults — a brand-new tenant mid-provisioning (no sb_site_settings row
// yet) or a failed fetch must still show a usable preview, not a blank/broken editor.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: null, logoAlt: null, logoText: null, faviconUrl: null,
  businessName: 'Your Store', tagline: null, description: null,
  contactPhone: null, contactEmail: null, contactAddress: null,
  socialLinks: [], navLinks: [],
  headerBackgroundColor: '#ffffff', headerTextColor: '#1a202c', headerAccentColor: '#1a202c',
  headerSticky: true, headerCtaText: null, headerCtaUrl: null,
  footerBackgroundColor: '#1a202c', footerTextColor: '#a0aec0', footerAccentColor: '#ffffff',
  footerCopyrightText: null, footerColumns: [],
  whatsappEnabled: false, whatsappPopupEnabled: true, whatsappPhone: null,
  whatsappMessageTitle: 'Chat with us on WhatsApp!', whatsappMessageBody: 'Hello, how can we help you?',
  whatsappButtonColor: '#25D366',
  announcementEnabled: false, announcementMessage: null, announcementMode: 'static',
  announcementBgColor: '#dc2626', announcementTextColor: '#ffffff', announcementLinkUrl: null,
  announcementSpeed: 20,
}
