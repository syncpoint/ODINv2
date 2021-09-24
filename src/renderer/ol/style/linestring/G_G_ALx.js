import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

const corridor = title => ({ styles, lineString, resolution, feature }) => {
  const width = resolution * 10
  const coords = TS.coordinates(lineString)
  const options = {
    joinStyle: TS.BufferParameters.JOIN_ROUND,
    endCapStyle: TS.BufferParameters.CAP_ROUND
  }

  const segments = R.aperture(2, coords)
    .map(points => TS.lineString(points))
    .map(line => TS.buffer(options)(line)(width))

  const texts = (() => {
    if (!feature.get('t')) return []
    else {
      const text = `${title} ${feature.get('t')}`
      return R.aperture(2, coords)
        .map(TS.segment)
        .map(segment => [segment.midPoint(), segment.angle()])
        .map(([point, angle]) => styles.label(TS.point(point), {
          text,
          flip: true,
          textAlign: () => 'center',
          rotation: Math.PI - angle
        }))
    }
  })()

  // NOTE: cut start/end cap
  // const corridor = TS.collect([
  //   TS.difference([R.head(segments).getBoundary(), TS.pointBuffer(TS.startPoint(lineString))(width * 1.01)]),
  //   ...R.take(segments.length - 2, R.drop(1, segments)),
  //   TS.difference([R.last(segments).getBoundary(), TS.pointBuffer(TS.endPoint(lineString))(width * 1.01)])
  // ])

  return [
    styles.solidStroke(TS.collect(segments)),
    ...texts
  ]
}


styles['LineString:G*G*ALC---'] = corridor('AC') // AIR CORRIDOR
styles['LineString:G*G*ALM---'] = corridor('MRR') // MINIMUM RISK ROUTE (MRR)
styles['LineString:G*G*ALS---'] = corridor('SAAFR') // STANDARD-USE ARMY AIRCRAFT FLIGHT ROUTE (SAAFR)
styles['LineString:G*G*ALU---'] = corridor('UA') // UNMANNED AIRCRAFT (UA) ROUTE
styles['LineString:G*G*ALL---'] = corridor('LLTR') // LOW LEVEL TRANSIT ROUTE (LLTR)
