import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

const corridor = title => ({ geometry, resolution }) => {
  const width = resolution * 10
  const coords = TS.coordinates(geometry)
  const options = {
    joinStyle: TS.BufferParameters.JOIN_ROUND,
    endCapStyle: TS.BufferParameters.CAP_ROUND
  }

  const segments = R.aperture(2, coords)
    .map(points => TS.lineString(points))
    .map(line => TS.buffer(options)(line)(width))

  const labels = R.aperture(2, coords)
    .map(TS.segment)
    .map(segment => [segment.midPoint(), TS.rotation(segment)])
    .map(([point, rotation]) => ({
      id: 'style:default-text',
      'text-field': `t ? "${title} " + t : "${title}"`,
      'text-justify': 'center',
      'text-rotate': rotation,
      'text-clipping': 'none',
      geometry: TS.point(point)
    }))

  const path = TS.collect(segments)

  return [
    { id: 'style:2525c/solid-stroke', geometry: path },
    ...labels
  ]
}


styles['LineString:G*G*ALC---'] = corridor('AC') // AIR CORRIDOR
styles['LineString:G*G*ALM---'] = corridor('MRR') // MINIMUM RISK ROUTE (MRR)
styles['LineString:G*G*ALS---'] = corridor('SAAFR') // STANDARD-USE ARMY AIRCRAFT FLIGHT ROUTE (SAAFR)
styles['LineString:G*G*ALU---'] = corridor('UA') // UNMANNED AIRCRAFT (UA) ROUTE
styles['LineString:G*G*ALL---'] = corridor('LLTR') // LOW LEVEL TRANSIT ROUTE (LLTR)
