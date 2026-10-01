// Build-time config for the BULL VALLEY SCADUSCOPE (/bull-valley-scaduscope/).
// The background loop is optional: the page only inlines an audio URL when the
// file is actually present, so a missing loop degrades to a silent gate
// (a single "Engage" button) instead of a failed request.

const fs = require('fs')
const path = require('path')

const AUDIO_FILE = 'bull-valley-scaduscope.mp3'
const audioPath = path.resolve(__dirname, '..', 'assets', 'audio', AUDIO_FILE)

module.exports = {
  audio: fs.existsSync(audioPath)
    ? { src: `/assets/audio/${AUDIO_FILE}` }
    : null,
  data: {
    geo: '/assets/data/bull-valley/geo.json',
    terrain: '/assets/data/bull-valley/terrain.png',
  },
}
