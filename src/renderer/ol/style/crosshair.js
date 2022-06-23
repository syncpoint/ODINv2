import { Circle as CircleStyle, RegularShape, Stroke, Style } from 'ol/style'

const crosshair = (selected = false, radius = 30) => {
  return [
    ...[new Style({
      image: new CircleStyle({
        stroke: new Stroke({ color: (selected ? 'red' : 'black'), width: 2 }),
        radius
      })
    })], ...[0, 1, 2, 3].map(direction => new Style({
      image: new RegularShape({
        stroke: new Stroke({ color: (selected ? 'red' : 'black'), width: 2 }),
        rotation: direction * Math.PI / 2,
        points: 2,
        radius: radius / 2,
        displacement: [0, 0.8 * radius]
      })
    }))]
}

export default crosshair
