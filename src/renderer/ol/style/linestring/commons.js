import * as style from 'ol/style'
import * as TS from '../../ts'
import { PI, PI_OVER_4 } from '../../../../shared/Math'

export const fenceX = ([point, angle, displacement]) => new style.Style({
  geometry: TS.point(point),
  image: new style.RegularShape({
    stroke: new style.Stroke({ color: 'black', width: 3 }),
    points: 4,
    radius: 8,
    radius2: 0,
    angle: PI_OVER_4,
    rotation: PI - angle,
    scale: [1, 1.4],
    displacement: displacement || [0, 0]
  })
})

export const fenceO = ([point, angle, displacement]) => new style.Style({
  geometry: TS.point(point),
  image: new style.RegularShape({
    stroke: new style.Stroke({ color: 'black', width: 3 }),
    points: 8,
    radius: 8,
    radius2: 8,
    angle: PI_OVER_4,
    rotation: PI - angle,
    scale: [0.8, 1.4],
    displacement: displacement || [0, 0]
  })
})

export const fenceDoubleX = ([point, angle]) => [
  new style.Style({
    geometry: TS.point(point),
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: PI_OVER_4,
      rotation: PI - angle,
      scale: [1, 1.4],
      displacement: [-10, 0]
    })
  }),
  new style.Style({
    geometry: TS.point(point),
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: PI_OVER_4,
      rotation: PI - angle,
      scale: [1, 1.4],
      displacement: [10, 0]
    })
  })
]

export const fenceLine = geometry => new style.Style({
  geometry,
  stroke: new style.Stroke({ color: 'black', width: 3 })
})
