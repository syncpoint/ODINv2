import * as R from 'ramda'

const arrowPoints = (TS, resolution, angle, point) =>
  TS.projectCoordinates(resolution * 8, angle, point)([[-1, 0.6], [0, 0], [-1, -0.6]])

export const openArrow = (TS, resolution, angle, point) =>
  TS.lineString(R.props([0, 1, 2], arrowPoints(TS, resolution, angle, point)))
