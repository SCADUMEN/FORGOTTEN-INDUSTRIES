const fs = require('fs')
const path = require('path')

const archivePath = path.join(
  __dirname,
  '..',
  '..',
  'dist',
  'forgotten-industries.json'
)
const searchPath = path.join(__dirname, '..', '..', 'dist', 'search-index.json')

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function slug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function compact(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addTerm(map, kind, value, record) {
  const label = compact(value)
  const termSlug = slug(label)
  if (!termSlug) return

  if (!map.has(termSlug)) {
    map.set(termSlug, {
      kind,
      slug: termSlug,
      label,
      url: `/archive/${kind}/${termSlug}/`,
      records: [],
    })
  }

  map.get(termSlug).records.push(record)
}

function recordsFromSearch(searchIndex) {
  return (searchIndex.documents || []).map((record) => ({
    id: compact(record.id),
    type: compact(record.type),
    record_type: compact(record.record_type),
    public_layer: compact(record.public_layer),
    title: compact(record.title || record.id),
    url: record.url,
    date: compact(record.date),
    category: compact(record.category),
    object: compact(record.object),
    system: compact(record.system),
    condition: compact(record.condition),
    status: compact(record.status),
    associated_project: compact(record.associated_project || record.project),
    tags: Array.isArray(record.tags) ? record.tags.filter(Boolean) : [],
    summary: compact(
      record.summary || record.body || 'Indexed archive record.'
    ),
    source: compact(record.source),
  }))
}

module.exports = function () {
  const archive = readJson(archivePath, {
    projects: [],
    inventory: [],
    fieldLogs: [],
    socialPosts: [],
  })
  const searchIndex = readJson(searchPath, { documents: [] })
  const records = recordsFromSearch(searchIndex)
  const projectsById = Object.fromEntries(
    archive.projects.map((project) => [project.id, project])
  )

  const authority = archive.taxonomy || {
    id: 'FI-TAXONOMY-unavailable',
    title: 'Forgotten Industries Taxonomy',
    status: 'unavailable',
    rule: 'Run the archive build to load the working taxonomy authority.',
    axes: {},
    discovery_indexes: [],
    migration_order: [],
  }

  const groups = {
    categories: new Map(),
    tags: new Map(),
    status: new Map(),
    systems: new Map(),
    objects: new Map(),
    projects: new Map(),
  }

  for (const record of records) {
    addTerm(groups.categories, 'categories', record.category, record)
    addTerm(groups.status, 'status', record.status, record)
    addTerm(groups.systems, 'systems', record.system, record)
    addTerm(groups.objects, 'objects', record.object, record)
    addTerm(groups.projects, 'projects', record.associated_project, record)

    for (const tag of record.tags) {
      addTerm(groups.tags, 'tags', tag, record)
    }
  }

  const sortTerms = (terms) =>
    Array.from(terms.values()).sort((a, b) => {
      if (b.records.length !== a.records.length) {
        return b.records.length - a.records.length
      }
      return a.label.localeCompare(b.label)
    })

  const taxonomy = {
    records,
    projectsById,
    categories: sortTerms(groups.categories),
    tags: sortTerms(groups.tags),
    status: sortTerms(groups.status),
    systems: sortTerms(groups.systems),
    objects: sortTerms(groups.objects),
    projects: sortTerms(groups.projects).map((term) => {
      const project = projectsById[term.label]
      return project
        ? {
            ...term,
            title: project.title,
            label: project.id,
            url: `/archive/projects/${slug(project.slug || project.id)}/`,
          }
        : term
    }),
  }

  function authorityTerms(axisName, recordField, queryField) {
    const axis = authority.axes?.[axisName] || {
      label: axisName,
      question: '',
      terms: [],
    }

    return {
      label: axis.label,
      question: axis.question,
      terms: (axis.terms || []).map((term) => {
        const matchingRecords = recordField
          ? records.filter((record) => record[recordField] === term.id)
          : []
        const query = queryField
          ? encodeURIComponent(`${queryField}:${term.id}`)
          : ''

        return {
          ...term,
          slug: slug(term.id),
          records: matchingRecords,
          url: term.route || (query ? `/l-archive/?q=${query}` : ''),
        }
      }),
    }
  }

  taxonomy.native = {
    id: authority.id,
    title: authority.title,
    status: authority.status,
    authority: authority.authority,
    sourceDocument: authority.source_document,
    rule: authority.rule,
    publicLayers: authorityTerms('public_layers', 'public_layer', 'layer'),
    recordTypes: authorityTerms('record_types', 'record_type', 'family'),
    evidenceStates: authorityTerms('evidence_states'),
    lifecycleStates: authorityTerms('lifecycle_states'),
    discoveryIndexes: authority.discovery_indexes || [],
    migrationOrder: authority.migration_order || [],
  }

  taxonomy.native.allTerms = [
    ...taxonomy.native.publicLayers.terms,
    ...taxonomy.native.recordTypes.terms,
    ...taxonomy.native.evidenceStates.terms,
    ...taxonomy.native.lifecycleStates.terms,
  ]

  taxonomy.sourceTerms = [
    ...taxonomy.categories,
    ...taxonomy.tags,
    ...taxonomy.status,
    ...taxonomy.systems,
    ...taxonomy.objects,
    ...taxonomy.projects,
  ]

  // allTerms is retained for existing instrumentation. It now means the
  // controlled FI authority, not every recovered hashtag or narrative note.
  taxonomy.allTerms = taxonomy.native.allTerms

  return taxonomy
}
