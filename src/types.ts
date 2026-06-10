export type ArchiveDate = string

export type ArchiveDisposition =
  | 'archive'
  | 'keep pending test'
  | 'undecided'
  | 'for sale later'
  | 'archive only'

export interface ArchiveSourceFile {
  label: string
  path: string
}

export interface ArchiveMeta {
  name: string
  type: string
  tagline: string
  voice: string
  sourceFiles: ArchiveSourceFile[]
}

export interface ProjectOrigin {
  purchased?: string
  stored_for?: string
  context?: string
}

export interface LoopConcept {
  route: string[]
  preferences: string[]
}

export interface ArchiveProject {
  id: string
  slug: string
  title: string
  working_title?: string
  category: string
  status: string
  started?: ArchiveDate
  revived?: ArchiveDate
  summary: string
  origin?: ProjectOrigin
  themes: string[]
  artifacts?: string[]
  layout_goals?: string[]
  loop_concept?: LoopConcept
  documentation_style: string[]
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  quantity?: number | string
  associated_project: string
  condition: string
  status: string
  photos: string[]
  notes?: string
  estimated_value?: string | number | null
  keep_sell_archive?: ArchiveDisposition | string
  date_logged: ArchiveDate
}

export interface FieldLogSection {
  heading: string
  body: string
}

export interface FieldLog {
  id: string
  slug: string
  title: string
  date: ArchiveDate
  timestamp: string
  category: string
  associated_project: string
  object: string
  system: string
  status: string
  tags: string[]
  sections: FieldLogSection[]
  signature: string
}

export interface SocialMediaAsset {
  type: 'image' | 'video'
  path?: string
  poster?: string
  source_url?: string
  poster_source_url?: string
  width?: number
  height?: number
}

export interface SocialPost {
  id: string
  source: 'tumblr' | 'instagram'
  source_id: string
  shortcode?: string
  source_url: string
  slug: string
  title: string
  date: ArchiveDate
  timestamp: string
  body: string
  tags: string[]
  like_count?: number
  comment_count?: number
  media: SocialMediaAsset[]
  post_path: string
}

export interface ForgottenIndustriesArchive {
  schemaVersion: string
  generatedAt: string
  meta: ArchiveMeta
  projects: ArchiveProject[]
  inventory: InventoryItem[]
  fieldLogs: FieldLog[]
  socialPosts: SocialPost[]
}
