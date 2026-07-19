'use strict'

const path = require('node:path')

// Public raster and video formats that may carry embedded coordinates. Keep
// this list shared by the scrubber and release audit so their coverage cannot
// drift apart.
const mediaExtensions = new Set([
  '.avif',
  '.gif',
  '.heic',
  '.heif',
  '.jpeg',
  '.jpg',
  '.m4v',
  '.mov',
  '.mp4',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
])

// ExifTool may expose coordinates as ordinary GPS tags, structured XMP fields
// such as LocationCreatedGPSLatitude, QuickTime GPSCoordinates, or derived
// Geolocation fields. Match every one of those families.
function findLocationTags(tags) {
  return Object.keys(tags).filter((key) => {
    if (/GPS/i.test(key) || /^Geolocation(?!Warning$)/i.test(key)) return true
    if (/^LocationInformation$/i.test(key)) return true
    return (
      /Location.*(?:Latitude|Longitude|Coordinates|Position|ISO6709)/i.test(
        key
      ) || /(?:Latitude|Longitude|Coordinates|Position).*Location/i.test(key)
    )
  })
}

// Clear GPS tags across EXIF, XMP, and QuickTime plus the two structured XMP
// location families and QuickTime's alternate location structure.
const locationStripArgs = [
  '-GPS*=',
  '-LocationCreatedGPS*=',
  '-LocationShownGPS*=',
  '-QuickTime:LocationInformation=',
  '-overwrite_original',
]

function isMedia(file) {
  return mediaExtensions.has(path.extname(file).toLowerCase())
}

module.exports = {
  findLocationTags,
  isMedia,
  locationStripArgs,
  mediaExtensions,
}
