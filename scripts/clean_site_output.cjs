const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const outputDir = path.resolve(root, '_site')

if (path.basename(outputDir) !== '_site' || !outputDir.startsWith(root)) {
  throw new Error(`Refusing to remove unexpected site output: ${outputDir}`)
}

fs.rmSync(outputDir, { recursive: true, force: true })
