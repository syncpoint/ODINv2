import * as R from 'ramda'
import { PI } from '../../../../shared/Math'
import * as TS from '../../ts'

export const quads = 64

export const arcText = styles => (anchor, rotation, text) => styles.outlinedText(anchor, {
  text,
  rotation: rotation - PI / 12
})

const arrowPoints = (resolution, angle, point) =>
  TS.projectCoordinates(resolution * 8, angle, point)([[-1, 0.6], [0, 0], [-1, -0.6]])

export const openArrow = (resolution, angle, point) =>
  TS.lineString(R.props([0, 1, 2], arrowPoints(resolution, angle, point)))
