import wkx from 'wkx'
import * as R from 'ramda'

const parseGeoJSON = wkx.Geometry.parseGeoJSON
const toGeoJSON = geometry => geometry.toGeoJSON()
const parse = wkx.Geometry.parse
const toWkb = geometry => geometry.toWkb()

export const wkb = {
  valueEncoding: {
    buffer: true,

    /**
     * Encode JSON (GeoJSON geometry) as WKB buffer.
     */
    encode: R.compose(toWkb, parseGeoJSON),

    /**
     * Deocde WKB buffer to JSON (GeoJSON geometry).
     */
    decode: R.compose(toGeoJSON, parse)
  }
}
