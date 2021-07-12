import { Fill, Stroke, Circle, Style } from 'ol/style'

export const COLOR_WHITE_40 = 'rgba(255,255,255,0.4)'
export const COLOR_CAROLINA_BLUE = '#3399CC' // https://coolors.co/3399cc
export const FILL_WHITE_40 = new Fill({ color: COLOR_WHITE_40 })
export const STROKE_CAROLINA_BLUE = new Stroke({ color: COLOR_CAROLINA_BLUE, width: 1.25 })

export const STYLE_OL_DEFAULT = (() => {
  const fill = FILL_WHITE_40
  const stroke = STROKE_CAROLINA_BLUE
  const image = new Circle({ fill, stroke, radius: 5 })
  return new Style({ image, fill, stroke })
})()
