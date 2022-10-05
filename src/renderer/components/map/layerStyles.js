import { Fill, Stroke, Circle, Style } from 'ol/style'

const highlightStyle = (() => {
  const fill = new Fill({ color: 'rgba(255,50,50,0.4)' })
  const stroke = new Stroke({ color: 'black', width: 1, lineDash: [10, 5] })
  return [
    new Style({
      image: new Circle({ fill, stroke, radius: 50 }),
      fill,
      stroke
    })
  ]
})()

export default (services, sources) => ({
  highlightStyle
})
