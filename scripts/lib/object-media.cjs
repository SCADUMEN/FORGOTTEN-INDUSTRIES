// Which of an inventory object's `photos` are public stills and footage, and
// which still carries its link preview. Shared by eleventy.config.js (object
// pages, og:image) and scripts/build_media_derivatives.cjs (preview images), so
// the page and the builder agree on the file.

// `photos` is a mixed media list: source stills, QuickTime clips from a
// phone, and private HEIC originals that never clear the public path check.
// Renderers need the stills and the footage kept apart, because an extension
// the browser cannot decode in an <img> is a broken record, not a photograph.
// Anything unrecognised (.heic today) is withheld rather than published broken.
const OBJECT_IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)$/i
const OBJECT_VIDEO_EXTENSIONS = /\.(mov|mp4|webm)$/i

// Apple's Messages ignores or shrinks to an icon any preview image under 150px
// wide (TN3156). Below that, the builder writes an enlarged copy at 600px:
// comfortably clear of the cutoff, and enlarging further adds no detail.
const LINK_PREVIEW_MIN_WIDTH = 150
const LINK_PREVIEW_WIDTH = 600
const LINK_PREVIEW_DIR = 'assets/previews'

function publicObjectMedia(item) {
  return Array.isArray(item?.photos)
    ? item.photos.filter(
        (photo) =>
          typeof photo === 'string' &&
          (photo.startsWith('assets/') ||
            photo.startsWith('forgotten-industries/'))
      )
    : []
}

function publicObjectPhotos(item) {
  return publicObjectMedia(item).filter((photo) =>
    OBJECT_IMAGE_EXTENSIONS.test(photo)
  )
}

function publicObjectVideos(item) {
  return publicObjectMedia(item).filter((photo) =>
    OBJECT_VIDEO_EXTENSIONS.test(photo)
  )
}

// The still a link preview is built from: the primary photo, or its
// `<name>-still.<ext>` poster when one is listed beside it (a GIF's or a
// clip's extracted frame). Site-relative, no leading slash; '' when none.
function linkPreviewPhoto(item) {
  const photos = publicObjectPhotos(item)
  const primary = photos[0]
  if (!primary) return ''
  const posterPrefix = `${primary.replace(/\.[^.]+$/, '')}-still.`
  return photos.find((photo) => photo.startsWith(posterPrefix)) || primary
}

// Where the builder writes the enlarged preview for a too-small still,
// mirroring its path (less a leading assets/) under LINK_PREVIEW_DIR.
// Site-relative, no leading slash.
function linkPreviewDerivative(photo) {
  const relative = photo.replace(/^assets\//, '').replace(/\.[^.]+$/, '')
  return `${LINK_PREVIEW_DIR}/${relative}.jpeg`
}

module.exports = {
  LINK_PREVIEW_DIR,
  LINK_PREVIEW_MIN_WIDTH,
  LINK_PREVIEW_WIDTH,
  linkPreviewDerivative,
  linkPreviewPhoto,
  publicObjectPhotos,
  publicObjectVideos,
}
