import { Circle as CircleStyle, RegularShape, Stroke, Style } from 'ol/style'

const crosshair = (selected = false, radius = 30) => {
  const stroke = new Stroke({ color: (selected ? 'red' : 'black'), width: 2 })
  return [
    ...[new Style({
      image: new CircleStyle({
        stroke,
        radius
      })
    })],
    ...[new Style({
      image: new CircleStyle({
        stroke,
        radius: 2
      })
    })],
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

export default crosshair
