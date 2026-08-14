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

export interface TaxonomyTerm {
  id: string
  label: string
  definition: string
  route?: string
}

export interface TaxonomyAxis {
  label: string
  field: string
  question: string
  terms: TaxonomyTerm[]
}

export interface TaxonomyDiscoveryIndex {
  id: string
  label: string
  route: string
  definition: string
}

export interface ArchiveTaxonomy {
  id: string
  title: string
  status: string
  authority: string
  source_document: string
  rule: string
  axes: {
    public_layers: TaxonomyAxis
    record_types: TaxonomyAxis
    evidence_states: TaxonomyAxis
    lifecycle_states: TaxonomyAxis
  }
  discovery_indexes: TaxonomyDiscoveryIndex[]
  migration_order: string[]
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

export interface ProofOfConcept {
  thesis: string
  build_direction: string[]
  time_capsule_option: string[]
  decision_rule: string
}

export interface ProjectSourceLink {
  label: string
  type: 'local' | 'git' | 'document' | string
  role: string
  path?: string
  url?: string
}

export interface ArchiveProject {
  id: string
  slug: string
  // title is the short canonical name used in nav, cards, and headings.
  // working_title is the optional longer, narrative descriptor (e.g. the
  // original dossier headline) shown where fuller context is wanted.
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
  source_links?: ProjectSourceLink[]
  layout_goals?: string[]
  loop_concept?: LoopConcept
  proof_of_concept?: ProofOfConcept
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
  archive_entry?: string
  tags?: string[]
  notes?: string
  estimated_value?: string | number | null
  keep_sell_archive?: ArchiveDisposition | string
  date_logged: ArchiveDate
}

export interface FieldLogSection {
  heading: string
  body: string
}

export interface AtlasReportProvenance {
  classification: string
  human_authority: string
  operating_layer: string
  editorial_system: string
  implementation_system: string
  disclosure: string
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
  condition?: string
  status: string
  summary?: string
  source_path?: string
  tags: string[]
  sections: FieldLogSection[]
  signature: string
}

export interface VoiceFieldLog {
  id: string
  title: string
  date: ArchiveDate
  recorded_at: string
  recorder: string
  audio: string
  duration?: string
  summary: string
  transcript?: string
  tags: string[]
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
  taxonomy: ArchiveTaxonomy
  projects: ArchiveProject[]
  inventory: InventoryItem[]
  atlasReportProvenance: AtlasReportProvenance
  fieldLogs: FieldLog[]
  voiceLogs: VoiceFieldLog[]
  socialPosts: SocialPost[]
}
