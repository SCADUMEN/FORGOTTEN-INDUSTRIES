// Object record gallery: clicking a thumbnail promotes it to the primary
// evidence figure and re-labels the caption.
//
// This lives in an external file rather than inline in object.njk so that every
// object record ships byte-identical JavaScript. Inlining it meant the caption
// prefix was interpolated per object, producing a unique script — and therefore
// a unique Content-Security-Policy hash — on all 91 object pages. The prefix is
// read from a data attribute instead, so one hash (or none, under script-src
// 'self') covers the whole archive, and the file is cached once for all of it.
;(function () {
  var gallery = document.querySelector('.object-record')
  if (!gallery) return

  var captionPrefix = gallery.getAttribute('data-caption-prefix') || ''
  var primaryLink = gallery.querySelector('[data-object-primary-link]')
  var primaryImage = gallery.querySelector('[data-object-primary-image]')
  var primaryCaption = gallery.querySelector('[data-object-primary-caption]')
  var thumbnails = gallery.querySelectorAll('[data-object-thumbnail]')
  if (!primaryLink || !primaryImage || !thumbnails.length) return

  thumbnails.forEach(function (thumbnail) {
    thumbnail.addEventListener('click', function (event) {
      event.preventDefault()
      var image = thumbnail.querySelector('img')
      var index = thumbnail.getAttribute('data-photo-index')
      primaryLink.href = thumbnail.href
      primaryImage.src = thumbnail.href
      primaryImage.alt = image ? image.alt : primaryImage.alt
      if (primaryCaption) {
        primaryCaption.textContent =
          captionPrefix + String(index).padStart(2, '0')
      }
      thumbnails.forEach(function (item) {
        item.removeAttribute('aria-current')
      })
      thumbnail.setAttribute('aria-current', 'true')
    })
  })
})()
