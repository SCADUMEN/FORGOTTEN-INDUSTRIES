// MAPLE LEAF RAG ZONE ignition modal: the entry gate the zone opens with. Forked from
// ZOOT's intro.js (src/assets/js/zoot/intro.js). It doubles as the user gesture
// browsers require before audio may play with sound — "Extra Crispy" turns the
// rag on, "Silent Running" keeps it silent.
//
// The modal markup ships hidden (so no-JS visitors fall through to the
// <noscript> panel); this reveals it, wires the buttons, traps focus, and calls
// onChoose(wantsSound). No-ops if the modal isn't on the page.

export function createIntro({ onChoose } = {}) {
  const modal = document.getElementById('mlr-intro')
  if (!modal) return

  const buttons = Array.from(modal.querySelectorAll('[data-mlr-sound]'))
  if (!buttons.length) return

  const choose = (wantsSound) => {
    modal.hidden = true
    document.removeEventListener('keydown', onKey, true)
    if (typeof onChoose === 'function') onChoose(wantsSound)
  }

  // Escape maps to Silent Running; Tab is trapped between the two buttons.
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      choose(false)
    } else if (event.key === 'Tab') {
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () =>
      choose(button.dataset.mlrSound === 'on')
    )
  })
  document.addEventListener('keydown', onKey, true)

  modal.hidden = false
  const primary = modal.querySelector('.mlr-intro-btn--primary') || buttons[0]
  primary.focus()
}
