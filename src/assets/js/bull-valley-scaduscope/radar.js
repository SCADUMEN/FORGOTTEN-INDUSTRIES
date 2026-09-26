// BULL VALLEY SCADUSCOPE radar: an old-school plan-position sweep centred on
// the village. The shader draws the rotating line, its phosphor wedge, and the
// range rings; this module owns the timing and the echo arithmetic both the
// shader and the overlay share, so a shadowman lights up exactly as the line
// crosses him and fades over the rest of the rotation.
//
// Angles are screen angles in CSS px with y down, so increasing angle is a
// clockwise sweep — the classic radar direction.

const TAU = Math.PI * 2

// Tempo: the radar runs on the music's grid. One rotation is 14 beats at
// 120 BPM (7 s), and the sweep line pulses once per whole note (4 beats,
// 2 s), on the downbeat of each bar.
export const BPM = 120
export const BEAT_SECONDS = 60 / BPM
export const SWEEP_BEATS = 14
export const SWEEP_SECONDS = SWEEP_BEATS * BEAT_SECONDS
export const PULSE_BEATS = 4
export const PULSE_SECONDS = PULSE_BEATS * BEAT_SECONDS
// How fast a flash fades, per second: gone in about a quarter second.
const FLASH_DECAY = 12
// Encoder padding at the head of bull-valley-scaduscope.mp3: decoded, the
// first sound is 29.8 ms in (measured with ffmpeg). The file has no gapless
// header, so browsers play that silence; the song's 0:00 downbeat is heard at
// this playback position. Re-measure if the file is re-exported.
export const AUDIO_LEAD_SECONDS = 0.03

export function sweepAngle(beatTime) {
  return ((beatTime / SWEEP_SECONDS) * TAU) % TAU
}

// Pulse 0..1: a sharp flash on each whole note that fades well before the next.
export function pulse(beatTime) {
  const since = ((beatTime % PULSE_SECONDS) + PULSE_SECONDS) % PULSE_SECONDS
  return Math.exp(-since * FLASH_DECAY)
}

// Which beep the current pulse follows. The song's submarine beep is a B that
// alternates octaves on each whole note, the higher one on the 0:00 downbeat
// (measured: even downbeats carry strong upper-B energy, odd ones are low B3).
// 0 = high beep (phosphor green), 1 = low beep (hot magenta). The colour holds
// until the next pulse.
export function pulseTint(beatTime) {
  const n = Math.floor(beatTime / PULSE_SECONDS)
  return ((n % 2) + 2) % 2
}

// Beat clock: the animation clock shifted so the flash lands on the song's
// downbeats. The first time the loop plays, the clock snaps to it, so the
// sweep leaves 12 o'clock on the song's first beat. After that, each frame
// nudges it toward the nearest bar line of the playback position (compared
// within one bar), so a loop of any whole number of bars stays locked across
// its seam and the sweep never jumps. Silent, it free-runs.
export function createBeatClock() {
  let offset = 0
  let locked = false
  return {
    now(time, audioTime) {
      if (audioTime != null) {
        const target = time - audioTime
        if (!locked) {
          offset = target
          locked = true
        } else {
          let error =
            (((offset - target) % PULSE_SECONDS) + PULSE_SECONDS) %
            PULSE_SECONDS
          if (error > PULSE_SECONDS / 2) error -= PULSE_SECONDS
          offset -= error * 0.05
        }
      }
      return time - offset
    },
  }
}

// How far behind the sweep a bearing sits, 0..TAU (0 = the line is on it now).
export function behind(sweep, bearing) {
  return (((sweep - bearing) % TAU) + TAU) % TAU
}

// Phosphor persistence as a fraction of one rotation: short and crisp when
// sober, long and smeared at 10.
export function persistence(high01) {
  return 0.3 + 0.45 * high01
}

// Echo brightness 0..1 for something `since` radians behind the sweep.
export function echo(since, high01) {
  return Math.exp((-since / (TAU * persistence(high01))) * 3)
}
