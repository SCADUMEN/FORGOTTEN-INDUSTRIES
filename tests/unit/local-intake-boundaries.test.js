import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

describe('local intake boundaries', () => {
  it('recursively ignores every audio format supported by local Whisper', () => {
    const transcriptionScript = fs.readFileSync(
      path.join(ROOT, 'scripts/transcribe_local_whisper.py'),
      'utf8'
    )
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')
    const supportedBlock = transcriptionScript.match(
      /SUPPORTED_SUFFIXES\s*=\s*\{([^}]+)\}/
    )

    expect(supportedBlock).not.toBeNull()

    const suffixes = [
      ...supportedBlock[1].matchAll(/["'](\.[A-Za-z0-9]+)["']/g),
    ].map((match) => match[1])

    expect(suffixes.length).toBeGreaterThan(0)

    for (const suffix of suffixes) {
      expect(gitignore).toContain(`/intake/**/*${suffix.toLowerCase()}`)
      expect(gitignore).toContain(`/intake/**/*${suffix.toUpperCase()}`)
    }
  })
})
