import type { Data } from '@measured/puck'

export type TemplateCategory =
  | 'fashion'
  | 'digital'
  | 'restaurant'
  | 'beauty'
  | 'furniture'
  | 'pets'
  | 'general'

export interface TemplateCategoryOption {
  value: TemplateCategory | 'all'
  label: string
}

export const TEMPLATE_CATEGORY_OPTIONS: TemplateCategoryOption[] = [
  { value: 'all',        label: 'All Templates' },
  { value: 'fashion',    label: 'Fashion & Jewellery' },
  { value: 'digital',    label: 'Electronics' },
  { value: 'beauty',     label: 'Health & Beauty' },
  { value: 'restaurant', label: 'Food & Beverage' },
  { value: 'pets',       label: 'Pet Supplies' },
  { value: 'furniture',  label: 'Home & Garden' },
  { value: 'general',    label: 'General' },
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
