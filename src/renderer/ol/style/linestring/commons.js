import * as R from 'ramda'
import * as TS from '../../ts'
import { PI, PI_OVER_4 } from '../../../../shared/Math'

export const fenceX = ([point, angle, displacement]) => ({
  geometry: TS.point(point),
  'shape-line-color': 'black',
  'shape-line-width': 3,
  'shape-points': 4,
  'shape-radius': 8,
  'shape-radius-2': 0,
  'shape-angle': PI_OVER_4,
  'shape-rotate': PI - angle,
  'shape-scale': [1, 1.4],
  'shape-offset': displacement || [0, 0]
})

export const fenceO = ([point, angle, displacement]) => ({
  geometry: TS.point(point),
  'shape-line-color': 'black',
  'shape-line-width': 3,
  'shape-points': 8,
  'shape-radius': 8,
  'shape-radius-2': 8,
  'shape-angle': PI_OVER_4,
  'shape-rotate': PI - angle,
  'shape-scale': [0.8, 1.4],
  'shape-offset': displacement || [0, 0]
})

export const fenceXX = ([point, angle]) => [
  {
    geometry: TS.point(point),
    'shape-line-color': 'black',
    'shape-line-width': 3,
    'shape-points': 4,
    'shape-radius': 8,
    'shape-radius-2': 0,
    'shape-angle': PI_OVER_4,
    'shape-rotate': PI - angle,
    'shape-scale': [1, 1.4],
    'shape-offset': [-8, 0]
  },
  {
    geometry: TS.point(point),
    'shape-line-color': 'black',
    'shape-line-width': 3,
    'shape-points': 4,
    'shape-radius': 8,
    'shape-radius-2': 0,
    'shape-angle': PI_OVER_4,
    'shape-rotate': PI - angle,
    'shape-scale': [1, 1.4],
    'shape-offset': [8, 0]
  }
]

export const fencePoints = (geometry, resolution, factor) => {
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * factor
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2

  return R.range(0, n).map(i => {
    const A = line.extractPoint(offset + i * width)
    const B = line.extractPoint(offset + (i + 1) * width)
    const segment = TS.segment([A, B])
    return [line.extractPoint(offset + i * width + width / 2), segment.angle()]
  })
}
