const { execSync } = require('child_process')

const gitHash = (() => {
  try {
    return execSync('git rev-parse HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
})()

const gitHashShort = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
})()

const navRows = [
  [
    {
      label: "L'ARCHIVE",
      french: "L'Archive",
      english: 'Archive',
      href: '/archive.html',
      summary:
        'Canonical records, inventory, source documents, and preserved evidence.',
    },
  ],
  [
    {
      label: 'LES PROJETS',
      french: 'Les Projets',
      english: 'Projects',
      href: '/#projects',
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
      href: '/posts/index.html',
      summary: 'Long-form posts, field doctrine, and curated written entries.',
    },
    {
      label: 'EN DIRECT',
      french: 'En Direct',
      english: 'Live',
      href: '/field-notes/',
      summary: 'Bluesky dispatches imported on-site as live field notes.',
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
  gitHash,
  gitHashShort,
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
        'The historical record: documentation, provenance, research, old hardware references, forum archaeology, photos, part identification, manuals, diagrams, and unknown-component investigation.',
      tone: 'Precise, reverent, scientific/medical, archival, curious.',
      note: 'The museum wing.',
    },
    {
      label: 'Field Notes',
      slug: 'field-notes',
      href: '/field-notes/',
      purpose:
        'Archived dispatches imported from the live field signal: short active-process notes from the bench, garage, field, desk, or improvised lab environment.',
      tone: 'Immediate, practical, exploratory.',
      note: 'Not every post needs to be polished. Some posts are field notes.',
    },
    {
      label: 'Projects',
      slug: 'projects',
      href: '/#projects',
      purpose:
        'Structured context packets for Codex, GitHub, the site, and long-running continuity.',
      tone: 'Organized, durable, clear, exportable.',
      note: 'Where active builds become dossiers.',
    },
    {
      label: 'Research',
      slug: 'manuscripts',
      href: '/#manuscripts',
      purpose:
        'Longer essays, recovered context, investigations, memoir fragments, and finished written pieces that do not need to pretend they are bench notes.',
      tone: 'Literary, personal, exact, alive, evidence-minded.',
      note: 'The research shelf.',
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
