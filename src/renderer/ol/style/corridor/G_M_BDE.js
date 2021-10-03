import { styles } from '../styles'
import * as TS from '../../ts'
import { closedArrow } from './commons'

// TACGRP.MOBSU.OBSTBP.DFTY.ESY - BYPASS EASY
styles['LineString:Point:G*M*BDE---'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(resolution, angle, point))

  const path = TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2),
    ...arrows
  ])

  return [
    { id: 'style:2525c/solid-fill', geometry: TS.union(arrows) },
    { id: 'style:2525c/solid-stroke', geometry: path }
  ]
}
