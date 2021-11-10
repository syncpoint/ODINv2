import * as R from 'ramda'
import { Polygon, LineString, MultiPolygon, MultiLineString, GeometryCollection } from 'ol/geom'

const lerp = t => (v0, v1) => v0 * (1 - t) + v1 * t
const lerpB = lerp(0.25)
const lerpXY = ([[x1, y1], [x2, y2]]) => [
  [lerpB(x1, x2), lerpB(y1, y2)],
  [lerpB(x2, x1), lerpB(y2, y1)]
]

const chaikinLine = (coords, n) => {
  if (n === 0) return coords

  const xs = R.dropLast(1, coords)
    .map(([x1, y1], index) => [[x1, y1], coords[index + 1]])
    .flatMap(lerpXY)

  return chaikinLine([R.head(coords), ...xs, R.last(coords)], n - 1)
}

const chaikinRing = (coords, n) => {
  if (n === 0) return coords

  const xs = coords
    .map(([x1, y1], index) => [[x1, y1], coords[(index + 1) % coords.length]])
    .flatMap(lerpXY)

  return chaikinRing(xs, n - 1)
}

const K = v => fn => { fn(v); return v }
const I = v => v

const closeRing = coords => K(coords)(coords => coords.push(coords[0]))
const smoothRing = n => ring => closeRing(chaikinRing(R.dropLast(1, ring), n))
const smoothPolygon = n => polygon => polygon.map(smoothRing(n))
const smoothLine = n => line => chaikinLine(line, n)
const smoothCollection = n => geometry => geometry.getGeometries().map(geometry => smooth(geometry, n))

const mappers = n => ({
  Polygon: geometry => new Polygon(geometry.getCoordinates().map(smoothRing(n))),
  MultiPolygon: geometry => new MultiPolygon(geometry.getCoordinates().map(smoothPolygon(n))),
  LineString: geometry => new LineString(smoothLine(n)(geometry.getCoordinates())),
  MultiLineString: geometry => new MultiLineString(geometry.getCoordinates().map(smoothLine(n))),
  GeometryCollection: geometry => new GeometryCollection(smoothCollection(n)(geometry))
})

export const smooth = (geometry, n = 3) => (mappers(n)[geometry.getType()] || I)(geometry)
