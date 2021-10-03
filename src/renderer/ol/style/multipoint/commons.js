import { PI } from '../../../../shared/Math'

export const quads = 64

export const arcText = styles => (anchor, rotation, text) => styles.outlinedText(anchor, {
  text,
  rotation: rotation - PI / 12
})
