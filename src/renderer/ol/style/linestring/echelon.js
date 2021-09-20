// NOTE: Only used to calculate text widths.

const texts = {
  A: '∅', // TEAM/CREW
  B: '⦁', // SQUAD
  C: '⦁ ⦁', // SECTION
  D: '⦁ ⦁ ⦁', // PLATOON/DETACHMENT
  E: 'I', // COMPANY/BATTERY/TROOP
  F: 'I I', // BATALLION/SQUADRON
  G: 'I I I', // REGIMENT/GROUP
  H: 'X', // BRIGADE
  I: 'X X', // DIVISION
  J: 'X X X', // CORPS/MEF
  K: 'X X X X', // ARMY
  L: 'X X X X X', // ARMY GROUP/FRONT
  M: 'X X X X X X', // REGION
  N: '+ +' // COMMAND
}

const canvases = Object.entries(texts).reduce((acc, [key, text]) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  context.font = '18px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const metrics = context.measureText(text)
  context.fillText(text, 0, 0)
  acc[key] = metrics.width
  return acc
}, {})

console.log(canvases)
