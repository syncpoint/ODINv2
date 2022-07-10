import * as R from 'ramda'
import * as proj from 'ol/proj'
import MGRS, { LatLon } from 'geodesy/mgrs.js'
import UTM from 'geodesy/utm.js'
import Dms from 'geodesy/dms.js'
import convert from 'geo-coordinates-parser' // DMS

Dms.separator = ' '

/**
 * LATLON:  59.01502 25.99332
 * DMS:     40°26′46″N 79°58′56″W
 * DM:      40°26.767′N 79°58.933′W
 * D:       40.446°N 79.982°W
 * UTM:     35 N 411919 6521940
 * MGRS:    32U MV 61344 81745
 * PLUS:    9GC7XH2P+96
 */
const formatters = {
  LATLON: ([lng, lat]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  DMS: ([lng, lat]) => `${Dms.toLat(lat, 'dms')} ${Dms.toLon(lng, 'dms')}`,
  DDM: ([lng, lat]) => `${Dms.toLat(lat, 'dm')} ${Dms.toLon(lng, 'dm')}`,
  DD: ([lng, lat]) => `${Dms.toLat(lat, 'd')} ${Dms.toLon(lng, 'd')}`,
  MGRS: ([lng, lat]) => new LatLon(lat, lng).toUtm().toMgrs().toString(),
  UTM: ([lng, lat]) => new LatLon(lat, lng).toUtm().toString()
}

/**
 *
 */
const fromLonLat = arg => {
  if (Array.isArray(arg)) return proj.fromLonLat(arg)
  else if (arg.decimalLatitude && arg.decimalLongitude) return fromLonLat([arg.decimalLongitude, arg.decimalLatitude])
  else if (arg.lat && arg.lon) return fromLonLat([arg.lon, arg.lat])
  else return undefined
}

const mgrs2latLon = value => MGRS.parse(value).toUtm().toLatLon()
const utm2latLon = value => UTM.parse(value).toLatLon()

const parsers = {
  MGRS: R.compose(fromLonLat, mgrs2latLon),
  UTM: R.compose(fromLonLat, utm2latLon),
  LATLON: R.compose(fromLonLat, convert),
  DMS: R.compose(fromLonLat, convert),
  DDM: R.compose(fromLonLat, convert),
  DD: R.compose(fromLonLat, convert)
}


/**
 *
 */
export function CoordinatesFormat (emitter, preferencesStore) {
  preferencesStore.on('coordinatesFormatChanged', ({ format }) => {
    this.coordinatesFormat = format
    emitter.emit('preferences/changed')
  })

  ;(async () => {
    this.coordinatesFormat = await preferencesStore.get('coordinates-format', 'MGRS')
  })()
}

CoordinatesFormat.prototype.format = function (coordinate, format) {
  if (!this.coordinatesFormat) return
  format = format || this.coordinatesFormat
  const lonLat = proj.toLonLat(coordinate)
  return formatters[format](lonLat)
}

CoordinatesFormat.prototype.parse = function (s, format) {
  format = format || this.coordinatesFormat
  return (parsers[format] || R.always(undefined))(s)
}
