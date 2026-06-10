const fs = require('fs')
const path = require('path')

const archivePath = path.join(
  __dirname,
  '..',
  '..',
  'dist',
  'forgotten-industries.json'
)

module.exports = function () {
  if (!fs.existsSync(archivePath)) {
    return {
      meta: {},
      projects: [],
      inventory: [],
      fieldLogs: [],
      socialPosts: [],
    }
  }

  return JSON.parse(fs.readFileSync(archivePath, 'utf8'))
}
