// Types for the Studio "Pages" panel — mirrors the 8 columns added to
// sb_tenant_pages in store_builder_db_v13 (see Store_builder_model::PAGE_TYPES).

export type PageType =
  | 'static_content'
  | 'blog_list'
  | 'all_products'
  | 'product_category_list'
  | 'single_product_category'
  | 'anchor_link'
  | 'external_url'

export type MenuLocation = 'none' | 'main' | 'footer'

// anchor_link -> { anchor: '#section' }, external_url -> { url: 'https://...' },
// single_product_category -> { categoryId: number }. Empty/absent for every
// other type.
export interface PageTypeConfig {
  anchor?: string
  url?: string
  categoryId?: number
}

export interface StorePage {
  id: number
  page_slug: string
  page_name: string
  page_type: PageType
  page_type_config: PageTypeConfig | null
  is_published: 0 | 1
  published_at: string | null
  updated_at: string
  menu_location: MenuLocation
  menu_order: number
  menu_parent_id: number | null
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
}

// page_type values that are pure nav-menu link targets, never opened in the
// Puck editor — the Pages panel's "Edit" action is hidden/disabled for these.
export const LINK_ONLY_PAGE_TYPES: PageType[] = ['anchor_link', 'external_url']

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  static_content: 'Static content',
  blog_list: 'Blog list',
  all_products: 'All products',
  product_category_list: 'Product category list',
  single_product_category: 'Single product category',
  anchor_link: 'Anchor link',
  external_url: 'External URL',
}
