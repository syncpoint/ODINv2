import { Stroke, Circle, RegularShape, Style } from 'ol/style'

const crosshair = (color, radius = 30) => {
  const stroke = new Stroke({ color, width: 2 })
  const bigCircle = new Circle({ stroke, radius: 30 })
  const smallCircle = new Circle({ stroke, radius: radius / 15 })

  return [
    new Style({ image: bigCircle }),
    new Style({ image: smallCircle }),
    ...[0, 1, 2, 3].map(direction => new Style({
      image: new RegularShape({
        stroke,
        rotation: direction * Math.PI / 2,
        points: 2,
        radius: radius / 2,
        displacement: [0, 0.8 * radius]
      })
    }))]
}

export default $ =>
  $.selectionMode.map(mode =>
    mode === 'default'
      ? crosshair('black')
      : crosshair('red')
)
