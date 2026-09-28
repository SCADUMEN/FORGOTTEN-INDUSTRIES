// BULL VALLEY SCADUSCOPE landmarks: hand-placed points that are not part of
// the public-infrastructure survey (scripts/fetch_bull_valley.cjs), so they
// live here rather than in geo.json, which every survey refresh rewrites.
//
// Keep the list to places meant to be found (a roadside stand) or whose owners
// have agreed to be on a public map (a private home).

export const LANDMARKS = [
  // Dave Coleman's house in Wonder Lake, near the frame's north edge. A private
  // home, placed with his consent.
  { n: "Mt. Coleman's Keep", lat: 42.3839451, lon: -88.3479778 },
  // The roadside cabbage stand on the southeast corner where Mason Hill Road
  // ends at Crystal Lake Road South. Approximate: offset ~30 m southeast of the
  // surveyed intersection (42.30627, -88.31599), since the survey has no
  // buildings to snap to.
  { n: 'Bull Valley Cabbage Stand', lat: 42.306, lon: -88.3156 },
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
