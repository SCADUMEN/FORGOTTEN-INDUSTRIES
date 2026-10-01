// BULL VALLEY SCADUSCOPE names: local-folklore names for shadowmen. A
// shadowman is nameless until someone tags it; then the site Worker
// (src/worker/index.js) picks a name from these lists and records it forever
// in D1 with how many times it has been tagged. The page imports the same
// module to name tags locally when the Worker can't be reached.
//
// The places are real public features of Bull Valley, taken from the survey
// data (scripts/fetch_bull_valley.cjs): roads, creeks, cemeteries, and
// conservation areas. The titles and epithets are invented, in the register of
// antiquarian ghost stories, folk horror, and Zone fiction: the genre's common
// words (sexton, revenant, stalker, wicker) and original compounds, never a
// coinage lifted from any one work. The name space is finite on purpose (about
// seven thousand), so names recur and a record like "Mother Ostend · tagged
// 14×" can build up over time.

export const PLACES = [
  'Boone Creek',
  'Powers Creek',
  'Boger Bog',
  'Dufield Pond',
  'Wolf Oak',
  'Windy Knoll',
  'Boloria Meadow',
  'Fairview',
  'Ostend',
  'Holcombville',
  'Thompson Road',
  'McConnell Road',
  'Mason Hill',
  'Crystal Springs',
  'Greenwood',
  'Country Club',
  'Cherry Valley',
  'Fleming Road',
  'Draper Road',
  'Curran Road',
  'Bull Valley Road',
]

// Short forms for "Title Place" names ("Mother Ostend", "Old Man Draper").
export const SHORT_PLACES = [
  'Boone',
  'Powers',
  'Boger',
  'Dufield',
  'Ostend',
  'Fairview',
  'Holcombville',
  'Thompson',
  'McConnell',
  'Mason',
  'Fleming',
  'Draper',
  'Curran',
  'Greenwood',
]

export const TITLES = [
  'Mother',
  'Old Man',
  'Widow',
  'Brother',
  'Sister',
  'Deacon',
  'Grandfather',
  'Little',
  'Pale',
  'Old',
  'Parson',
  'Aunt',
  'Uncle',
  'Squire',
  'Canon',
  'Father',
  'Cousin',
  'Granny',
]

export const NOUNS = [
  'Mourner',
  'Walker',
  'Watcher',
  'Lantern',
  'Drifter',
  'Tenant',
  'Surveyor',
  'Hitchhiker',
  'Sleepwalker',
  'Mile Man',
  'Night Clerk',
  'Ditch Saint',
  'Crossing Guard',
  'Gleaner',
  'Late Guest',
  'Hollow',
  'Stranger',
  'Lodger',
  'Sexton',
  'Verger',
  'Antiquary',
  'Revenant',
  'Stalker',
  'Warden',
  'Reeve',
  'Toll Keeper',
  'Hedge Priest',
  'Lamplighter',
  'Bellringer',
  'Pilgrim',
  'Visitor',
  'Bound Beater',
  'Straw Man',
  'Well Keeper',
  'Whistler',
  'Chorister',
]

export const EPITHETS = [
  'Hollow',
  'Quiet',
  'Crooked',
  'Grey',
  'Gentle',
  'Tall',
  'Lantern',
  'Barefoot',
  'Patient',
  'Rust',
  'Ash',
  'Hush',
  'Hooded',
  'Salt',
  'Wicker',
  'Thorn',
]

export const GIVEN = [
  'Jack',
  'Ada',
  'Silas',
  'Mae',
  'Ezra',
  'Opal',
  'Amos',
  'Iris',
  'Otis',
  'Wren',
  'Abel',
  'June',
  'Agnes',
  'Tobias',
  'Hester',
  'Jasper',
  'Martha',
  'Eli',
]

const pick = (list, rand) =>
  list[Math.floor(rand() * list.length) % list.length]

// A folklore name. `rand` returns [0, 1); the Worker passes a crypto-backed
// source, tests pass a seeded one.
export function generateName(rand = Math.random) {
  const pattern = rand()
  if (pattern < 0.45) return `The ${pick(PLACES, rand)} ${pick(NOUNS, rand)}`
  if (pattern < 0.75) return `${pick(TITLES, rand)} ${pick(SHORT_PLACES, rand)}`
  return `${pick(EPITHETS, rand)} ${pick(GIVEN, rand)} of ${pick(PLACES, rand)}`
}

// How many distinct names the lists can produce, for the record.
export const NAME_SPACE =
  PLACES.length * NOUNS.length +
  TITLES.length * SHORT_PLACES.length +
  EPITHETS.length * GIVEN.length * PLACES.length
