import * as R from 'ramda'
import * as TS from '../../../ol/ts'
import { PI } from '../../../../shared/Math'

export const fenceX = ([point, angle, displacement]) => ({
  id: 'style:2525c/fence-x',
  geometry: TS.point(point),
  'shape-rotate': PI - angle,
  'shape-offset': displacement || [0, 0]
})

export const fenceO = ([point, angle, displacement]) => ({
  id: 'style:2525c/fence-o',
  geometry: TS.point(point),
  'shape-rotate': PI - angle,
  'shape-offset': displacement || [0, 0]
})

export const fenceXX = ([point, angle]) => [
  {
    id: 'style:2525c/fence-x',
    geometry: TS.point(point),
    'shape-rotate': PI - angle,
    'shape-offset': [-8, 0]
  },
  {
    id: 'style:2525c/fence-x',
    geometry: TS.point(point),
    'shape-rotate': PI - angle,
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
