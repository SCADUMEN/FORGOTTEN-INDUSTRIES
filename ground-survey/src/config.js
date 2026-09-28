// Every gameplay and rendering knob in one place.
export const CONFIG = {
  render: {
    // Internal render resolution is the CSS size divided by this; the canvas
    // is upscaled with image-rendering: pixelated for the PS1 grain.
    downscale: 3,
    fogDensity: 0.0055,
    far: 1400,
  },
  player: {
    eyeHeight: 1.7,
    crouchEyeHeight: 1.05,
    walkSpeed: 4.2,
    sprintSpeed: 9,
    crouchSpeed: 2.2,
    scopeSpeedScale: 0.6,
    mouseSensitivity: 0.0023,
  },
  shadowmen: {
    count: 14,
    // Beyond this they drift dormant; inside it they start working on you.
    activateRange: 150,
    stalkDistance: 34,
    stalkSpeed: 3.4,
    huntSpeed: 8,
    strikeRange: 2.4,
    escapeRange: 70,
    escapeSeconds: 8,
    // Staring at one this long provokes it.
    stareSeconds: 4,
    detectRange: 45,
    detectThreshold: 6,
  },
  items: {
    // Cigarette: nerves drain hard while smoking, but the ember raises the
    // shadowmen's detection range while lit and shortly after.
    cigaretteSeconds: 12,
    emberSeconds: 20,
    emberDetectScale: 1.5,
    // Joint: two minutes of perception — shadowmen resolve through the murk —
    // but the nerves meter reads soft and slow the whole time.
    jointSeconds: 15,
    perceptionSeconds: 120,
  },
  scope: {
    rangeMetres: 250,
    sweepSeconds: 3.2,
  },
}
