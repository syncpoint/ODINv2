import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'
import { openArrow } from './commons'

// TASKS / DISRUPT
styles['G*T*T-----'] = ({ feature, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const interpolate = ([fraction, segment]) => {
    segment.p1 = segment.pointAlong(fraction)
    return segment
  }

  const segments = R.zip([0.5, 0.75, 1], R.splitEvery(2, R.props([2, 5, 0, 3, 1, 4], [
    coords[0], ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]),
    coords[1], ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  ])))
    .map(([fraction, coords]) => [fraction, TS.segment(coords)])
    .map(interpolate)

  const arrows = segments.map(segment => openArrow(resolution, angle, segment.p1))

  const geometry = TS.collect([
    TS.lineString(segments[0]),
    TS.lineString(segments[1]),
    TS.lineString(segments[2]),
    TS.lineString([segments[0].p0, segments[2].p0]),
    TS.lineString([segments[1].pointAlong(-0.25), segments[1].p0]),
    ...arrows
  ])

  return [
    styles.defaultStroke(geometry)(feature),
    styles.text({
      text: 'D',
      flip: true,
      rotation: Math.PI - angle
    }, TS.point(segment.midPoint()))
  ]
}
