import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

const corridor = title => ({ geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const buffer = TS.lineBuffer(lineString)(width / 2).buffer(1)

  const label = ([point, rotation]) => ({
    id: 'style:default-text',
    'text-field': `t ? "${title} " + t : "${title}"`,
    'text-justify': 'center',
    'text-rotate': rotation,
    'text-clipping': 'none',
    geometry: TS.point(point)
  })

  const labels = R.aperture(2, TS.coordinates(lineString))
    .map(TS.segment)
    .map(segment => [segment.midPoint(), TS.rotation(segment)])
    .map(label)

  const path = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ])

  return [
    { id: 'style:2525c/solid-stroke', geometry: path },
    ...labels
  ]
}

styles['LineString:Point:G*G*ALC---'] = corridor('AC') // AIR CORRIDOR
styles['LineString:Point:G*G*ALM---'] = corridor('MRR') // MINIMUM RISK ROUTE (MRR)
styles['LineString:Point:G*G*ALS---'] = corridor('SAAFR') // STANDARD-USE ARMY AIRCRAFT FLIGHT ROUTE (SAAFR)
styles['LineString:Point:G*G*ALU---'] = corridor('UA') // UNMANNED AIRCRAFT (UA) ROUTE
styles['LineString:Point:G*G*ALL---'] = corridor('LLTR') // LOW LEVEL TRANSIT ROUTE (LLTR)
