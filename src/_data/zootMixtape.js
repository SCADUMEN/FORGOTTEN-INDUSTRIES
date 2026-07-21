// ZOOT background audio: the FORGOTTEN INDUSTRIES mixtape (DJ STUXNET), sourced
// from the canonical @tyleretters/discography package rather than a hardcoded
// URL. Resolves the release's single-track `mp3_url` — the directly playable,
// range-served file on assets.the-rn.info (the release-level `mp3_url` is a
// .zip download, not playable). Exposed to templates as `zootMixtape`:
// { src } when the release/track is present, otherwise null (ZOOT then no-ops).
import discography from '@tyleretters/discography'

const RELEASE_SLUG = 'forgotten-industries'

export default () => {
  const release = discography.find((entry) => entry.slug === RELEASE_SLUG)
  const track = release && release.tracks && release.tracks[0]
  return track && track.mp3_url ? { src: track.mp3_url } : null
}
