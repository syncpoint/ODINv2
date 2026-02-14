import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import { Style, Stroke, Text, Fill } from 'ol/style'
import { fromLonLat, toLonLat } from 'ol/proj'
import { LatLon } from 'geodesy/mgrs.js'
import Utm from 'geodesy/utm.js'

// --- Constants ---

const LON_MIN = -180
const LON_MAX = 180
const LAT_MIN = -80 // MGRS/UTM southern limit
const LAT_MAX = 84  // MGRS/UTM northern limit

// Latitude band boundaries (each 8° except the last which is 12°)
const BAND_LETTERS = 'CDEFGHJKLMNPQRSTUVWX'
const BAND_BOUNDARIES = []
for (let lat = LAT_MIN; lat <= LAT_MAX; lat += 8) BAND_BOUNDARIES.push(lat)
// Last band X goes from 72 to 84 (12° tall), already covered by the loop

// Resolution thresholds (meters per pixel)
const THRESHOLD_100K = 1200
const THRESHOLD_10K = 120
const THRESHOLD_1K = 12

// Line interpolation steps
const GZD_STEPS = 20
const GRID_100K_STEPS = 10
const GRID_10K_STEPS = 5
const GRID_1K_STEPS = 3

// --- Styles ---
// Red tones for visibility on both light and dark basemaps.

const gzdStroke = new Stroke({ color: 'rgba(180, 30, 30, 0.7)', width: 3 })
const grid100kStroke = new Stroke({ color: 'rgba(200, 50, 50, 0.55)', width: 2 })
const grid10kStroke = new Stroke({ color: 'rgba(210, 70, 70, 0.45)', width: 1.5 })
const grid1kStroke = new Stroke({ color: 'rgba(220, 90, 90, 0.35)', width: 1.2 })

const gzdStyle = new Style({ stroke: gzdStroke })
const grid100kStyle = new Style({ stroke: grid100kStroke })
const grid10kStyle = new Style({ stroke: grid10kStroke })
const grid1kStyle = new Style({ stroke: grid1kStroke })

const labelStyle = (text, fontSize = 12) => new Style({
  geometry: feature => feature.getGeometry(),
  text: new Text({
    text,
    font: `bold ${fontSize}px sans-serif`,
    fill: new Fill({ color: 'rgba(180, 30, 30, 0.85)' }),
    stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.9)', width: 3 }),
    overflow: true
  })
})

// --- Utility ---

/**
 * Convert lon/lat to map coordinate (EPSG:3857).
 * Clamps latitude to avoid Mercator singularity.
 */
const toMapCoord = (lon, lat) => {
  const clampedLat = Math.max(-85, Math.min(85, lat))
  return fromLonLat([lon, clampedLat])
}

/**
 * Get the UTM zone number for a given longitude.
 */
const utmZone = lon => Math.floor((lon + 180) / 6) + 1

/**
 * Get the MGRS band letter for a given latitude.
 */
const bandLetter = lat => {
  if (lat < LAT_MIN || lat >= LAT_MAX) return null
  let index = Math.floor((lat - LAT_MIN) / 8)
  if (index >= BAND_LETTERS.length) index = BAND_LETTERS.length - 1
  return BAND_LETTERS[index]
}

/**
 * Build an interpolated line in map coordinates from a series of lon/lat waypoints.
 */
const interpolateLine = (points, steps) => {
  if (points.length < 2) return []
  const coords = []
  for (let i = 0; i < points.length - 1; i++) {
    const [lon0, lat0] = points[i]
    const [lon1, lat1] = points[i + 1]
    for (let s = 0; s <= (i === points.length - 2 ? steps : steps - 1); s++) {
      const t = s / steps
      const lon = lon0 + (lon1 - lon0) * t
      const lat = lat0 + (lat1 - lat0) * t
      coords.push(toMapCoord(lon, lat))
    }
  }
  return coords
}

/**
 * Convert UTM easting/northing to lon/lat.
 * Returns [lon, lat] or null if conversion fails.
 */
const utmToLonLat = (zone, hemisphere, easting, northing) => {
  try {
    const utm = new Utm(zone, hemisphere, easting, northing)
    const ll = utm.toLatLon()
    return [ll.lon, ll.lat]
  } catch (e) {
    return null
  }
}

// --- Grid Zone Designations (GZD) ---

/**
 * Generate GZD boundary features for the visible extent.
 */
const generateGZD = (lonMin, lonMax, latMin, latMax) => {
  const features = []

  const zoneStart = Math.max(1, utmZone(lonMin))
  const zoneEnd = Math.min(60, utmZone(lonMax))
  const effectiveLatMin = Math.max(LAT_MIN, latMin)
  const effectiveLatMax = Math.min(LAT_MAX, latMax)

  // Meridian lines (vertical zone boundaries)
  for (let z = zoneStart; z <= zoneEnd + 1; z++) {
    const lon = (z - 1) * 6 - 180
    if (lon < lonMin - 6 || lon > lonMax + 6) continue

    const coords = interpolateLine(
      [[lon, effectiveLatMin], [lon, effectiveLatMax]],
      GZD_STEPS
    )
    if (coords.length >= 2) {
      const f = new Feature({ geometry: new LineString(coords) })
      f.setStyle(gzdStyle)
      f.set('level', 'gzd')
      features.push(f)
    }
  }

  // Parallel lines (horizontal band boundaries)
  for (const lat of BAND_BOUNDARIES) {
    if (lat < effectiveLatMin || lat > effectiveLatMax) continue

    const coords = interpolateLine(
      [[Math.max(LON_MIN, lonMin), lat], [Math.min(LON_MAX, lonMax), lat]],
      GZD_STEPS
    )
    if (coords.length >= 2) {
      const f = new Feature({ geometry: new LineString(coords) })
      f.setStyle(gzdStyle)
      f.set('level', 'gzd')
      features.push(f)
    }
  }

  // Zone labels
  for (let z = zoneStart; z <= zoneEnd; z++) {
    const lonCenter = (z - 1) * 6 - 180 + 3

    for (let bi = 0; bi < BAND_LETTERS.length; bi++) {
      const latBottom = LAT_MIN + bi * 8
      const latTop = bi === BAND_LETTERS.length - 1 ? LAT_MAX : latBottom + 8
      const latCenter = (latBottom + latTop) / 2

      if (latCenter < effectiveLatMin || latCenter > effectiveLatMax) continue
      if (lonCenter < lonMin || lonCenter > lonMax) continue

      const coord = toMapCoord(lonCenter, latCenter)
      const f = new Feature({ geometry: new Point(coord) })
      f.setStyle(labelStyle(`${z}${BAND_LETTERS[bi]}`, 14))
      f.set('level', 'gzd-label')
      features.push(f)
    }
  }

  return features
}

// --- 100 km Grid ---

/**
 * Get the 100k letter pair for a given UTM zone, easting and northing.
 */
const get100kLetters = (zone, easting, northing) => {
  try {
    const lat = utmToLonLat(zone, 'N', easting + 50000, northing + 50000)
    if (!lat) return null
    const ll = new LatLon(lat[1], lat[0])
    const mgrs = ll.toUtm().toMgrs()
    return `${mgrs.e100k}${mgrs.n100k}`
  } catch (e) {
    return null
  }
}

/**
 * Generate 100 km grid features within visible UTM zones.
 */
const generate100k = (lonMin, lonMax, latMin, latMax) => {
  const features = []

  const zoneStart = Math.max(1, utmZone(lonMin))
  const zoneEnd = Math.min(60, utmZone(lonMax))

  for (let z = zoneStart; z <= zoneEnd; z++) {
    const zoneLonMin = (z - 1) * 6 - 180
    const zoneLonMax = zoneLonMin + 6

    // Determine UTM easting/northing range for visible area
    const visibleLonMin = Math.max(lonMin, zoneLonMin)
    const visibleLonMax = Math.min(lonMax, zoneLonMax)
    const visibleLatMin = Math.max(latMin, LAT_MIN)
    const visibleLatMax = Math.min(latMax, LAT_MAX)

    // Convert corners to UTM to find easting/northing range
    const corners = [
      [visibleLonMin, visibleLatMin],
      [visibleLonMax, visibleLatMin],
      [visibleLonMin, visibleLatMax],
      [visibleLonMax, visibleLatMax],
      [(visibleLonMin + visibleLonMax) / 2, visibleLatMin],
      [(visibleLonMin + visibleLonMax) / 2, visibleLatMax]
    ]

    let minE = Infinity, maxE = -Infinity, minN = Infinity, maxN = -Infinity

    for (const [lon, lat] of corners) {
      try {
        const ll = new LatLon(lat, lon)
        const utm = ll.toUtm()
        if (utm.zone === z) {
          minE = Math.min(minE, utm.easting)
          maxE = Math.max(maxE, utm.easting)
          minN = Math.min(minN, utm.northing)
          maxN = Math.max(maxN, utm.northing)
        }
      } catch (e) { /* skip invalid coords */ }
    }

    if (minE === Infinity) continue

    // Snap to 100k boundaries
    const e0 = Math.floor(minE / 100000) * 100000
    const e1 = Math.ceil(maxE / 100000) * 100000
    const n0 = Math.floor(minN / 100000) * 100000
    const n1 = Math.ceil(maxN / 100000) * 100000

    // Vertical lines (constant easting)
    for (let e = e0; e <= e1; e += 100000) {
      const linePoints = []
      for (let s = 0; s <= GRID_100K_STEPS; s++) {
        const n = n0 + (n1 - n0) * (s / GRID_100K_STEPS)
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) linePoints.push(ll)
      }
      if (linePoints.length >= 2) {
        const coords = linePoints.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid100kStyle)
        f.set('level', '100k')
        features.push(f)
      }
    }

    // Horizontal lines (constant northing)
    for (let n = n0; n <= n1; n += 100000) {
      const linePoints = []
      for (let s = 0; s <= GRID_100K_STEPS; s++) {
        const e = e0 + (e1 - e0) * (s / GRID_100K_STEPS)
        if (e < 100000 || e > 900000) continue // valid UTM easting range
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) linePoints.push(ll)
      }
      if (linePoints.length >= 2) {
        const coords = linePoints.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid100kStyle)
        f.set('level', '100k')
        features.push(f)
      }
    }

    // 100k square labels
    for (let e = e0; e < e1; e += 100000) {
      for (let n = n0; n < n1; n += 100000) {
        const centerE = e + 50000
        const centerN = n + 50000
        const letters = get100kLetters(z, e, n)
        if (!letters) continue
        const ll = utmToLonLat(z, 'N', centerE, centerN)
        if (!ll) continue
        if (ll[0] < visibleLonMin || ll[0] > visibleLonMax) continue
        if (ll[1] < visibleLatMin || ll[1] > visibleLatMax) continue

        const coord = toMapCoord(ll[0], ll[1])
        const f = new Feature({ geometry: new Point(coord) })
        f.setStyle(labelStyle(letters, 12))
        f.set('level', '100k-label')
        features.push(f)
      }
    }
  }

  return features
}

// --- 10 km Grid ---

/**
 * Generate 10 km grid features within visible UTM zones.
 */
const generate10k = (lonMin, lonMax, latMin, latMax) => {
  const features = []

  const zoneStart = Math.max(1, utmZone(lonMin))
  const zoneEnd = Math.min(60, utmZone(lonMax))

  for (let z = zoneStart; z <= zoneEnd; z++) {
    const zoneLonMin = (z - 1) * 6 - 180
    const zoneLonMax = zoneLonMin + 6

    const visibleLonMin = Math.max(lonMin, zoneLonMin)
    const visibleLonMax = Math.min(lonMax, zoneLonMax)
    const visibleLatMin = Math.max(latMin, LAT_MIN)
    const visibleLatMax = Math.min(latMax, LAT_MAX)

    const corners = [
      [visibleLonMin, visibleLatMin],
      [visibleLonMax, visibleLatMin],
      [visibleLonMin, visibleLatMax],
      [visibleLonMax, visibleLatMax],
      [(visibleLonMin + visibleLonMax) / 2, visibleLatMin],
      [(visibleLonMin + visibleLonMax) / 2, visibleLatMax]
    ]

    let minE = Infinity, maxE = -Infinity, minN = Infinity, maxN = -Infinity

    for (const [lon, lat] of corners) {
      try {
        const ll = new LatLon(lat, lon)
        const utm = ll.toUtm()
        if (utm.zone === z) {
          minE = Math.min(minE, utm.easting)
          maxE = Math.max(maxE, utm.easting)
          minN = Math.min(minN, utm.northing)
          maxN = Math.max(maxN, utm.northing)
        }
      } catch (e) { /* skip */ }
    }

    if (minE === Infinity) continue

    const e0 = Math.floor(minE / 10000) * 10000
    const e1 = Math.ceil(maxE / 10000) * 10000
    const n0 = Math.floor(minN / 10000) * 10000
    const n1 = Math.ceil(maxN / 10000) * 10000

    // Vertical lines (constant easting), skip 100k boundaries
    for (let e = e0; e <= e1; e += 10000) {
      if (e % 100000 === 0) continue // already drawn by 100k grid
      const linePoints = []
      for (let s = 0; s <= GRID_10K_STEPS; s++) {
        const n = n0 + (n1 - n0) * (s / GRID_10K_STEPS)
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) linePoints.push(ll)
      }
      if (linePoints.length >= 2) {
        const coords = linePoints.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid10kStyle)
        f.set('level', '10k')
        features.push(f)
      }
    }

    // Horizontal lines (constant northing), skip 100k boundaries
    for (let n = n0; n <= n1; n += 10000) {
      if (n % 100000 === 0) continue
      const linePoints = []
      for (let s = 0; s <= GRID_10K_STEPS; s++) {
        const e = e0 + (e1 - e0) * (s / GRID_10K_STEPS)
        if (e < 100000 || e > 900000) continue
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) linePoints.push(ll)
      }
      if (linePoints.length >= 2) {
        const coords = linePoints.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid10kStyle)
        f.set('level', '10k')
        features.push(f)
      }
    }

    // 10k square labels — positioned at center of each 10km square
    for (let e = e0; e < e1; e += 10000) {
      if (e + 10000 > e1) continue
      for (let n = n0; n < n1; n += 10000) {
        if (n + 10000 > n1) continue
        const centerE = e + 5000
        const centerN = n + 5000
        const ll = utmToLonLat(z, 'N', centerE, centerN)
        if (!ll) continue
        if (ll[0] < visibleLonMin || ll[0] > visibleLonMax) continue
        if (ll[1] < visibleLatMin || ll[1] > visibleLatMax) continue

        // Label: two-digit easting + two-digit northing within the 100k square
        const eDigit = Math.floor((e % 100000) / 10000)
        const nDigit = Math.floor((n % 100000) / 10000)
        const text = `${eDigit} · ${nDigit}`

        const coord = toMapCoord(ll[0], ll[1])
        const f = new Feature({ geometry: new Point(coord) })
        f.setStyle(labelStyle(text, 16))
        f.set('level', '10k-label')
        features.push(f)
      }
    }
  }

  return features
}

// --- 1 km Grid ---

/**
 * Generate 1 km grid features within visible UTM zones.
 */
const generate1k = (lonMin, lonMax, latMin, latMax) => {
  const features = []

  const zoneStart = Math.max(1, utmZone(lonMin))
  const zoneEnd = Math.min(60, utmZone(lonMax))

  for (let z = zoneStart; z <= zoneEnd; z++) {
    const zoneLonMin = (z - 1) * 6 - 180
    const zoneLonMax = zoneLonMin + 6

    const visibleLonMin = Math.max(lonMin, zoneLonMin)
    const visibleLonMax = Math.min(lonMax, zoneLonMax)
    const visibleLatMin = Math.max(latMin, LAT_MIN)
    const visibleLatMax = Math.min(latMax, LAT_MAX)

    const corners = [
      [visibleLonMin, visibleLatMin],
      [visibleLonMax, visibleLatMin],
      [visibleLonMin, visibleLatMax],
      [visibleLonMax, visibleLatMax],
      [(visibleLonMin + visibleLonMax) / 2, visibleLatMin],
      [(visibleLonMin + visibleLonMax) / 2, visibleLatMax]
    ]

    let minE = Infinity, maxE = -Infinity, minN = Infinity, maxN = -Infinity

    for (const [lon, lat] of corners) {
      try {
        const ll = new LatLon(lat, lon)
        const utm = ll.toUtm()
        if (utm.zone === z) {
          minE = Math.min(minE, utm.easting)
          maxE = Math.max(maxE, utm.easting)
          minN = Math.min(minN, utm.northing)
          maxN = Math.max(maxN, utm.northing)
        }
      } catch (e) { /* skip */ }
    }

    if (minE === Infinity) continue

    const e0 = Math.floor(minE / 1000) * 1000
    const e1 = Math.ceil(maxE / 1000) * 1000
    const n0 = Math.floor(minN / 1000) * 1000
    const n1 = Math.ceil(maxN / 1000) * 1000

    // Vertical lines (constant easting), skip 10k and 100k boundaries
    for (let e = e0; e <= e1; e += 1000) {
      if (e % 10000 === 0) continue // already drawn by 10k or 100k grid
      const linePoints = []
      for (let s = 0; s <= GRID_1K_STEPS; s++) {
        const n = n0 + (n1 - n0) * (s / GRID_1K_STEPS)
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) linePoints.push(ll)
      }
      if (linePoints.length >= 2) {
        const coords = linePoints.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid1kStyle)
        f.set('level', '1k')
        features.push(f)
      }
    }

    // Horizontal lines (constant northing), skip 10k and 100k boundaries
    for (let n = n0; n <= n1; n += 1000) {
      if (n % 10000 === 0) continue
      const linePoints = []
      for (let s = 0; s <= GRID_1K_STEPS; s++) {
        const e = e0 + (e1 - e0) * (s / GRID_1K_STEPS)
        if (e < 100000 || e > 900000) continue
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) linePoints.push(ll)
      }
      if (linePoints.length >= 2) {
        const coords = linePoints.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid1kStyle)
        f.set('level', '1k')
        features.push(f)
      }
    }

    // 1k square labels — positioned at center of each 1km square
    for (let e = e0; e < e1; e += 1000) {
      if (e + 1000 > e1) continue
      for (let n = n0; n < n1; n += 1000) {
        if (n + 1000 > n1) continue
        const centerE = e + 500
        const centerN = n + 500
        const ll = utmToLonLat(z, 'N', centerE, centerN)
        if (!ll) continue
        if (ll[0] < visibleLonMin || ll[0] > visibleLonMax) continue
        if (ll[1] < visibleLatMin || ll[1] > visibleLatMax) continue

        // Label: three-digit easting + three-digit northing within the 100k square
        const eDigit = String(Math.floor((e % 100000) / 1000)).padStart(2, '0')
        const nDigit = String(Math.floor((n % 100000) / 1000)).padStart(2, '0')
        const text = `${eDigit} · ${nDigit}`

        const coord = toMapCoord(ll[0], ll[1])
        const f = new Feature({ geometry: new Point(coord) })
        f.setStyle(labelStyle(text, 13))
        f.set('level', '1k-label')
        features.push(f)
      }
    }
  }

  return features
}

// --- Public API ---

/**
 * Create an MGRS graticule layer.
 * Returns an OL VectorLayer that updates on map move/zoom.
 */
export const createMGRSGraticule = (map) => {
  const source = new VectorSource()
  const layer = new VectorLayer({
    source,
    zIndex: 1000,
    updateWhileAnimating: false,
    updateWhileInteracting: false
  })

  const update = () => {
    const view = map.getView()
    const resolution = view.getResolution()
    const extent = view.calculateExtent(map.getSize())

    // Convert extent to lon/lat
    const [lonMin, latMin] = toLonLat([extent[0], extent[1]])
    const [lonMax, latMax] = toLonLat([extent[2], extent[3]])

    const features = []

    // Always show GZD
    features.push(...generateGZD(lonMin, lonMax, latMin, latMax))

    // Show 100k grid at medium zoom
    if (resolution <= THRESHOLD_100K) {
      features.push(...generate100k(lonMin, lonMax, latMin, latMax))
    }

    // Show 10k grid at high zoom
    if (resolution <= THRESHOLD_10K) {
      features.push(...generate10k(lonMin, lonMax, latMin, latMax))
    }

    // Show 1k grid at very high zoom
    if (resolution <= THRESHOLD_1K) {
      features.push(...generate1k(lonMin, lonMax, latMin, latMax))
    }

    source.clear(true)
    source.addFeatures(features)
  }

  map.on('moveend', update)
  // Initial render
  update()

  // Store cleanup reference
  layer.set('_mgrsCleanup', () => map.un('moveend', update))

  return layer
}
