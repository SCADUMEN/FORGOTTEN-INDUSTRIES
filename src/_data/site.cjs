const { execSync } = require('child_process')

function readCommand(command, fallback = 'unknown') {
  try {
    return execSync(command).toString().trim()
  } catch {
    return fallback
  }
}

const SITE_TIME_ZONE = 'America/Chicago'

function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce((values, part) => {
      values[part.type] = part.value
      return values
    }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function timeZoneOffsetMilliseconds(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce((values, part) => {
      values[part.type] = part.value
      return values
    }, {})

  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )

  return representedAsUtc - date.getTime()
}

function startOfDayInTimeZone(dateString, timeZone) {
  const utcGuess = new Date(`${dateString}T00:00:00.000Z`)
  const offset = timeZoneOffsetMilliseconds(utcGuess, timeZone)
  return new Date(utcGuess.getTime() - offset)
}

function countLines(value) {
  return value.split(/\r?\n/).filter(Boolean).length
}

function signedDelta(value) {
  if (value > 0) return `+${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return '0'
}

const gitHash = (() => {
  return readCommand('git rev-parse HEAD')
})()

const gitHashShort = (() => {
  return readCommand('git rev-parse --short HEAD')
})()

const sourceFileList = readCommand('git ls-files src', '')
  .split(/\r?\n/)
  .filter(Boolean)
const currentSiteDate = dateInTimeZone(new Date(), SITE_TIME_ZONE)
const deltaSince = addDays(currentSiteDate, -1)
const currentDayStart = startOfDayInTimeZone(
  currentSiteDate,
  SITE_TIME_ZONE
).toISOString()
const previousDayHead = readCommand(
  `git rev-list -1 --before="${currentDayStart}" HEAD`,
  ''
)
const previousCommitCount = previousDayHead
  ? Number(readCommand(`git rev-list --count ${previousDayHead}`, '0')) || 0
  : 0
const previousSourceFileCount = previousDayHead
  ? countLines(
      readCommand(`git ls-tree -r --name-only ${previousDayHead} -- src`, '')
    )
  : 0
const workingTreeShortstat = readCommand('git diff --shortstat', '')
const changedFilesMatch = workingTreeShortstat.match(/(\d+) files? changed/)
const insertionsMatch = workingTreeShortstat.match(/(\d+) insertions?\(\+\)/)
const deletionsMatch = workingTreeShortstat.match(/(\d+) deletions?\(-\)/)

const commitCount = Number(readCommand('git rev-list --count HEAD', '0')) || 0
const sourceFileCount = sourceFileList.length
const commitDelta = previousDayHead ? commitCount - previousCommitCount : 0
const sourceFileDelta = previousDayHead
  ? sourceFileCount - previousSourceFileCount
  : 0

const sourceStats = {
  commits: commitCount,
  sourceFiles: sourceFileList.length,
  commitDelta,
  commitDeltaLabel: signedDelta(commitDelta),
  sourceFileDelta,
  sourceFileDeltaLabel: signedDelta(sourceFileDelta),
  deltaSince,
  changedFiles: changedFilesMatch ? Number(changedFilesMatch[1]) : 0,
  insertions: insertionsMatch ? Number(insertionsMatch[1]) : 0,
  deletions: deletionsMatch ? Number(deletionsMatch[1]) : 0,
  workingTree: workingTreeShortstat.length > 0 ? workingTreeShortstat : 'clean',
  deltaLabel:
    workingTreeShortstat.length > 0
      ? `${insertionsMatch ? insertionsMatch[1] : 0}+ / ${deletionsMatch ? deletionsMatch[1] : 0}-`
      : 'clean',
}

const navRows = [
  [
    {
      label: "L'ARCHIVE",
      french: "L'Archive",
      english: 'Archive',
      href: '/archive.html',
      summary:
        'La premiere providence: the master record for inventory, entries, source documents, and preserved evidence.',
    },
  ],
  [
    {
      label: 'LES PROJETS',
      french: 'Les Projets',
      english: 'Projects',
      href: '/projects/',
      summary:
        'Active dossiers, rebuilds, object records, and continuity packets.',
    },
    {
      label: 'LES MANUELS',
      french: 'Les Manuels',
      english: 'Manuals',
      href: '/hang-on-to-each-other/',
      summary:
        'Recovered instructions, procedures, references, and preservation notes.',
    },
    {
      label: 'LA SOURCE',
      french: 'La Source',
      english: 'Source',
      href: 'https://github.com/Forgotten-Industries/FORGOTTEN-INDUSTRIES',
      summary:
        'Public repository, build system, generated archive data, and code.',
    },
  ],
  [
    {
      label: 'LE SIGNAL',
      french: 'Le Signal',
      english: 'Signal',
      href: '/posts/',
      summary:
        'Authored signal: the blog, ATLAS reports, recorder field logs, doctrine, manifestos, and the public feed.',
    },
    {
      label: 'EN DIRECT',
      french: 'En Direct',
      english: 'Live',
      href: '/en-direct/',
      summary: 'The live shortform channel: imported Bluesky dispatches.',
    },
    {
      label: 'LE RÉDEMPTEUR',
      french: 'Le Rédempteur',
      english: 'Redeemer',
      href: '/about.html',
      summary: 'Origin, authorship, and the human identity behind the archive.',
    },
  ],
]

module.exports = {
  name: 'Forgotten Industries',
  buildTime: new Date().toISOString(),
  archiveState: new Date().toISOString().slice(0, 10),
  generator: "L'ARCHIVE Builder",
  aiProvenance: {
    standardUrl: '/docs/ai-generation-citation-standard.md',
    colophonUrl: '/colophon/#ai-generation-heading',
    shortDisclosure:
      'Matthew Taylor Marx directs, reviews, and authorizes publication. ATLAS is the project operating layer; OpenAI ChatGPT assists editorial synthesis; OpenAI Codex assists repository implementation and verification.',
    siteCitation:
      'Marx, Matthew Taylor, director and editor. Forgotten Industries. Developed with the ATLAS operating layer; editorial assistance from OpenAI ChatGPT; repository implementation assistance from OpenAI Codex.',
  },
  gitHash,
  gitHashShort,
  sourceStats,
  // Cache-busting token for static assets (see base.njk). Changes every commit.
  assetVersion: gitHashShort,
  url: 'https://forgotten-industries.net',
  domainUrl: 'https://forgotten-industries.net',
  domainHost: 'forgotten-industries.net',
  githubUrl: 'https://github.com/Forgotten-Industries/FORGOTTEN-INDUSTRIES',
  repository: 'Forgotten-Industries/FORGOTTEN-INDUSTRIES',
  eleventyUrl: 'https://www.11ty.dev/',
  contact: 'ATLAS@forgotten-industries.net',
  fieldNotesSubscribeUrl:
    'https://bsky.app/profile/forgotten-industry.bsky.social',
  author: 'Matthew Marx',

  tagline:
    'An archive and evidence-based memoir that explores what happens to the things we leave behind; abandoned places, unfinished projects, deserted machines, and the parts of ourselves we once thought lost.',
  defaultDescription:
    'An archive of restoration, memory, machines, recorded field logs, and the work of refusing disappearance.',
  defaultImage: '/assets/forgotten-industries.jpeg',
  defaultImageAlt: 'Forgotten Industries logo, EST MMXIV',

  navRows,
  nav: navRows.flat(),

  shelves: [
    {
      label: 'Le Rédempteur',
      slug: 'recoveries-restorations-le-redempteur',
      href: '/#recoveries-restorations-le-redempteur',
      purpose:
        'Machines coming back, and the human recovery that moves with them: rebuilds, repair arcs, watercooling resurrection, and restoration essays tied directly to project work.',
      tone: 'Grounded, emotional, technical, medical, scientific, psychological, redemptive.',
      note: 'The workbench and the soul are allowed to appear in the same post.',
    },
    {
      label: "L'Archive",
      slug: 'the-archive',
      href: '/archive.html',
      purpose:
        'La premiere providence: the master record for documentation, provenance, inventory, entries, old hardware references, forum archaeology, photos, part identification, manuals, diagrams, and unknown-component investigation.',
      tone: 'Precise, reverent, scientific/medical, archival, curious.',
      note: 'The museum wing.',
    },
    {
      label: 'Live Dispatches',
      slug: 'field-notes',
      href: '/field-notes/',
      purpose: 'Shortform dispatches imported from the live Bluesky signal.',
      tone: 'Immediate, practical, exploratory.',
      note: 'The radio channel.',
    },
    {
      label: 'ATLAS Reports',
      slug: 'field-logs',
      href: '/field-logs/',
      purpose:
        'AI-assisted end-of-day summaries: observations, decisions, recovered evidence, and next actions.',
      tone: 'Brief, dated, grounded, useful.',
      note: 'The operational summary lane.',
    },
    {
      label: 'Projects',
      slug: 'projects',
      href: '/projects/',
      purpose:
        'Structured context packets for Codex, GitHub, the site, and long-running continuity.',
      tone: 'Organized, durable, clear, exportable.',
      note: 'Where active builds become dossiers.',
    },
    {
      label: 'Research',
      slug: 'manuscripts',
      href: '/posts/',
      purpose:
        'Longer essays, recovered context, investigations, memoir fragments, doctrine, systems manifestos, and finished written pieces.',
      tone: 'Literary, personal, exact, alive, evidence-minded.',
      note: 'The authored signal shelf.',
    },
    {
      label: 'Manuals',
      slug: 'manuals',
      href: '/hang-on-to-each-other/',
      purpose:
        'Recovered instructions, procedures, references, and preservation notes for keeping abandoned systems intelligible.',
      tone: 'Useful, technical, careful, preservation-minded.',
      note: 'The access point for Hang On To Each Other.',
    },
    {
      label: 'About',
      slug: 'what-about-art',
      href: '/about.html',
      purpose:
        'Origin, authorship, contact, and the public explanation of what the archive is trying to preserve.',
      tone: 'Plain, direct, human.',
      note: 'The maker plate.',
    },
  ],
}
