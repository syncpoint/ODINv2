import { Circle, Fill, Stroke, Style } from 'ol/style'
export const FONT = '12px sans-serif'

export const baseStyle = selected => [
  new Style({
    stroke: new Stroke({
      color: selected ? 'blue' : 'red',
      width: 4
    })
  }),
  new Style({
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }),
  new Style({
    image: new Circle({
      radius: 4,
      fill: new Fill({
        color: 'blue'
      })
    })
  })
]
