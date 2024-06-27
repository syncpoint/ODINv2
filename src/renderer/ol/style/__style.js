import { Circle, Fill, Stroke, Style } from 'ol/style'

export const style = geometry => {
  const fill = new Fill({ color: 'rgba(255,255,255,0.3)' })
  const strokeColor = '#888'
  const stroke = new Stroke({ color: strokeColor, width: 1.25 })
  return new Style({
    geometry,
    image: new Circle({ fill: fill, stroke: stroke, radius: 5 }),
    fill: fill,
    stroke: stroke,
  })
}
