const { execSync } = require('child_process')

function readCommand(command, fallback = 'unknown') {
  try {
    return execSync(command).toString().trim()
  } catch {
    return fallback
  }
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
const workingTreeShortstat = readCommand('git diff --shortstat', '')
const changedFilesMatch = workingTreeShortstat.match(/(\d+) files? changed/)
const insertionsMatch = workingTreeShortstat.match(/(\d+) insertions?\(\+\)/)
const deletionsMatch = workingTreeShortstat.match(/(\d+) deletions?\(-\)/)

const sourceStats = {
  commits: Number(readCommand('git rev-list --count HEAD', '0')) || 0,
  sourceFiles: sourceFileList.length,
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
        'Authored signal: recoveries, restorations, doctrine, manifestos, field reports, and the public feed.',
    },
    {
      label: 'EN DIRECT',
      french: 'En Direct',
      english: 'Live',
      href: '/en-direct/',
      summary: 'The live shortform channel: imported Bluesky field notes.',
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
    'An archive of restoration, memory, machines, field notes, and the work of refusing disappearance.',
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
      label: 'Field Notes',
      slug: 'field-notes',
      href: '/field-notes/',
      purpose:
        'Archived Bluesky dispatches imported from the live field signal.',
      tone: 'Immediate, practical, exploratory.',
      note: 'The radio channel.',
    },
    {
      label: 'Field Logs',
      slug: 'field-logs',
      href: '/field-logs/',
      purpose:
        'Authored field reports from the bench: observations, process notes, and dated records that belong under Le Signal rather than the live channel.',
      tone: 'Brief, dated, grounded, useful.',
      note: 'The field report lane.',
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
