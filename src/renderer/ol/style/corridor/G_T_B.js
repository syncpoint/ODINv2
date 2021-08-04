import { styles } from '../styles'
import * as TS from '../ts'

// TASKS / BLOCK
styles['G*T*B-----'] = ({ feature, lineString, width }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const fractions = [[0, 1], [0, -1]]

  const geometry = TS.collect([
    lineString,
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])(fractions))
  ])

  return [
    styles.defaultStroke({}, geometry)(feature),
    styles.text({
      text: 'B',
      flip: true,
      rotation: Math.PI - angle
    }, TS.point(segment.midPoint()))
  ]
}
