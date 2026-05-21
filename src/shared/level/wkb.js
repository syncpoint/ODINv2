import wkx from '@syncpoint/wkx'
import * as R from 'ramda'

const parseGeoJSON = wkx.Geometry.parseGeoJSON
const toGeoJSON = geometry => geometry.toGeoJSON()
const parse = wkx.Geometry.parse
const toWkb = geometry => geometry.toWkb()

/**
 * abstract-level custom value encoding: GeoJSON geometry <-> WKB buffer.
 * Shape follows level-transcoder ({ name, format, encode, decode }).
 */
export const wkb = {
  name: 'wkb',
  format: 'buffer',

  /** Encode JSON (GeoJSON geometry) as WKB buffer. */
  encode: R.compose(toWkb, parseGeoJSON),

  /** Decode WKB buffer to JSON (GeoJSON geometry). */
  decode: R.compose(toGeoJSON, parse)
}
