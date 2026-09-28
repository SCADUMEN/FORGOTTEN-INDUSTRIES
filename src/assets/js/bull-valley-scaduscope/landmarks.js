// BULL VALLEY SCADUSCOPE landmarks: hand-placed points that are not part of
// the public-infrastructure survey (scripts/fetch_bull_valley.cjs), so they
// live here rather than in geo.json, which every survey refresh rewrites.
//
// Each entry is a private place added with its owner's consent. Keep the list
// to places whose owners have agreed to be on a public map.

export const LANDMARKS = [
  // Dave Coleman's house in Wonder Lake, north of the village frame.
  { n: 'Chateau Coleman', lat: 42.3839451, lon: -88.3479778 },
]

// Project into the survey's unit square (x right, y down), the same
// equirectangular mapping the fetch script uses. Points outside the frame keep
// their out-of-range coordinates; the overlay draws them as bearings.
export function projectLandmarks(bbox, list = LANDMARKS) {
  return list.map((l) => ({
    n: l.n,
    p: [
      (l.lon - bbox.west) / (bbox.east - bbox.west),
      (bbox.north - l.lat) / (bbox.north - bbox.south),
    ],
  }))
}
