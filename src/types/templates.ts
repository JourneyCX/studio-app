import type { Data } from '@measured/puck'

// A category is just whatever slug the admin-managed store_theme_categories
// table holds (see Store_theme_manager_model::get_theme_categories(), fetched
// via stratumApi.getThemeCategories()) — no longer a fixed frontend union, so
// a category Dana adds/renames from the CI3 admin Categories screen shows up
// here without a studio-app rebuild. 'general' remains the safe default for
// anything saved before this list existed or fetched before the API responds.
export type TemplateCategory = string

export interface TemplateCategoryOption {
  value: TemplateCategory | 'all'
  label: string
}

// Fallback only — used before the real list has loaded (or if the fetch
// fails) so the picker never renders empty. Real categories always come from
// stratumApi.getThemeCategories() once available; see useTemplateManager.
export const FALLBACK_TEMPLATE_CATEGORY_OPTIONS: TemplateCategoryOption[] = [
  { value: 'all',     label: 'All Templates' },
  { value: 'general', label: 'General' },
]

export interface StoreTemplate {
  id: string
  name: string
  category: TemplateCategory
  thumbnail: string
  description: string
  tags: string[]
  puckState: Data
  isPersonal?: boolean
  createdAt?: string
}
