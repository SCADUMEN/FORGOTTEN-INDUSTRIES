module.exports = {
  name: "Forgotten Industries",
  url: "https://forgotten-industries.net",
  domainUrl: "https://forgotten-industries.net",
  domainHost: "forgotten-industries.net",
  githubUrl: "https://github.com/Forgotten-Industries/FORGOTTEN-INDUSTRIES",
  repository: "Forgotten-Industries/FORGOTTEN-INDUSTRIES",
  eleventyUrl: "https://www.11ty.dev/",
  contact: "officalmtmarx@gmail.com",
  fieldNotesSubscribeUrl: "https://bsky.app/profile/forgotten-industry.bsky.social",
  author: "Matthew Marx",

  tagline:
    "An archive and evidence-based memoir that explores what happens to the things we leave behind; abandoned places, unfinished projects, deserted machines, and the parts of ourselves we once thought lost.",

  nav: [
    { label: "L'ARCHIVE", href: "/archive.html" },
    {
      label: "Recoveries, Restorations, & 'Le Rédempteur'",
      href: "/#recoveries-restorations-le-redempteur",
    },
    {
      label: "Matthew Marx / Live Feed",
      href: "https://bsky.app/profile/forgotten-industry.bsky.social",
    },
    { label: "PROJECTS", href: "/#projects" },
    { label: "MANUSCRIPTS", href: "/#manuscripts" },
    { label: "MANUALS", href: "/hang-on-to-each-other/" },
    { label: "What About Art?", href: "/about.html" },
  ],

  shelves: [
    {
      label: "L'ARCHIVE",
      slug: "the-archive",
      href: "/archive.html",
      purpose:
        "The historical record: documentation, provenance, research, old hardware references, forum archaeology, photos, part identification, manuals, diagrams, and unknown-component investigation.",
      tone: "Precise, reverent, scientific/medical, archival, curious.",
      note: "The museum wing.",
    },
    {
      label: "Recoveries, Restorations, & 'Le Rédempteur'",
      slug: "recoveries-restorations-le-redempteur",
      href: "/#recoveries-restorations-le-redempteur",
      purpose:
        "Machines coming back, and the human recovery that moves with them: rebuilds, repair arcs, watercooling resurrection, and restoration essays tied directly to project work.",
      tone: "Grounded, emotional, technical, medical, scientific, psychological, redemptive.",
      note: "The workbench and the soul are allowed to appear in the same post.",
    },
    {
      label: "Field Notes",
      slug: "field-notes",
      href: "/#field-notes",
      purpose:
        "Archived field notes: short active-process notes from the bench, garage, field, desk, or improvised lab environment.",
      tone: "Immediate, practical, exploratory.",
      note: "Not every post needs to be polished. Some posts are field notes.",
    },
    {
      label: "Projects",
      slug: "projects",
      href: "/#projects",
      purpose:
        "Structured context packets for Codex, GitHub, the site, and long-running continuity.",
      tone: "Organized, durable, clear, exportable.",
      note: "Where active builds become dossiers.",
    },
    {
      label: "Manuscripts",
      slug: "manuscripts",
      href: "/#manuscripts",
      purpose:
        "Longer essays, reflections, memoir fragments, and finished written pieces that do not need to pretend they are technical notes.",
      tone: "Literary, personal, exact, alive.",
      note: "The writing shelf.",
    },
    {
      label: "Manuals",
      slug: "manuals",
      href: "/hang-on-to-each-other/",
      purpose:
        "Recovered instructions, procedures, references, and preservation notes for keeping abandoned systems intelligible.",
      tone: "Useful, technical, careful, preservation-minded.",
      note: "The access point for Hang On To Each Other.",
    },
    {
      label: "What About Art?",
      slug: "what-about-art",
      href: "/about.html",
      purpose:
        "Creative material that belongs to the archive but does not fit cleanly under science, hardware, manuals, or restoration.",
      tone: "Open, strange, sincere, playful.",
      note: "The final catch-all, on purpose.",
    },
  ],
};