import * as R from 'ramda'
import { Geometry } from 'ol/geom'
import { Icon, Style } from 'ol/style'
import * as TS from '../ts'
import { echelonCode } from '../../symbology/2525c'
import urls from './echelons.json'

const corrections = {
  A: 0, // 0
  B: 40, // *
  C: 30, // * (2)
  D: 20, // * (3)
  E: 50, // |
  F: 40, // | (2)
  G: 30, // | (3)
  H: 20, // X
  I: -70, // X(2)
  J: -100, // X(3)
  K: -150, // X(4)
  L: -200, // X(5)
  M: -260, // X(6)
  N: -50 // ++
}

export const createEchelon = options => {
  const { sidc, geometry, resolution } = options
  const code = echelonCode(sidc)
  const echelon = urls[code]
  if (!echelon) return { geometry, icon: [] }

  const [read, write] = (geometry instanceof Geometry)
    ? [TS.read, TS.write] // ol/Geometry
    : [R.identity, R.identity] // JSTS/Geometry

  const coords = TS.coordinates(read(geometry))
  const lineString = TS.lineString(coords)
  const line = TS.lengthIndexedLine(lineString)
  const scale = 0.15
  const correction = corrections[code] ? corrections[code] : 0
  const width = (echelon.width + correction) * resolution / 8
  const length = line.getEndIndex()
  const A = line.extractPoint(length / 2 - width)
  const B = line.extractPoint(length / 2 + width)
  const angle = TS.segment(
    line.extractPoint(length / 2 - 20),
    line.extractPoint(length / 2 + 20)
  ).angle()

  const notch = TS.lineBuffer(TS.lineString([A, B]))(resolution * 10)
  const notchedGeometry = TS.difference([lineString, notch])
  const anchor = write(TS.point(line.extractPoint(length / 2)))

  const icon = new Style({
    geometry: anchor,
    image: new Icon({
      scale,
      rotation: Math.PI - angle,
      src: echelon.url
    })
  })

  return { geometry: write(notchedGeometry), icon: [icon] }
}
