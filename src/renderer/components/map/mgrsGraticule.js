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
const LAT_MAX = 84 // MGRS/UTM northern limit

// Latitude band boundaries (each 8° except the last which is 12°)
const BAND_LETTERS = 'CDEFGHJKLMNPQRSTUVWX'
const BAND_BOUNDARIES = []
for (let lat = LAT_MIN; lat <= LAT_MAX; lat += 8) BAND_BOUNDARIES.push(lat)
// Last band X goes from 72 to 84 (12° tall), already covered by the loop

// --- UTM Special Zones ---
// Norway (band V, 56°-64°N): zone 31V is 3° wide (0°-3°E), zone 32V is 9° wide (3°-12°E)
// Svalbard (band X, 72°-84°N): zones 32X, 34X don't exist;
//   31X=0°-9°E, 33X=9°-21°E, 35X=21°-33°E, 37X=33°-42°E

/**
 * Get the actual longitude bounds for a UTM zone at a given latitude,
 * accounting for Norway and Svalbard exceptions.
 * Returns [lonMin, lonMax] or null if the zone doesn't exist at that latitude.
 */
const getZoneBounds = (zone, lat) => {
  const standardLonMin = (zone - 1) * 6 - 180
  const standardLonMax = standardLonMin + 6

  // Band V (56°-64°N): Norway exception
  if (lat >= 56 && lat < 64) {
    if (zone === 31) return [standardLonMin, 3] // narrowed: ends at 3°E
    if (zone === 32) return [3, standardLonMax] // widened: starts at 3°E
  }

  // Band X (72°-84°N): Svalbard exception
  if (lat >= 72 && lat < 84) {
    if (zone === 32 || zone === 34 || zone === 36) return null // these zones don't exist
    if (zone === 31) return [standardLonMin, 9] // 0°-9°E
    if (zone === 33) return [9, 21] // 9°-21°E
    if (zone === 35) return [21, 33] // 21°-33°E
    if (zone === 37) return [33, 42] // 33°-42°E
  }

  return [standardLonMin, standardLonMax]
}

/**
 * Get all zones that exist for a given latitude range,
 * with their actual longitude bounds.
 * Returns array of { zone, lonMin, lonMax }.
 */
// Band boundaries where zone widths change (special zones)
// At these latitudes, clipToZone changes its clip bounds, so we need
// extra interpolation points nearby for smooth transitions.
const SPECIAL_BAND_LATS = [56, 64, 72, 84]

/**
 * Generate northing sample values for vertical lines, ensuring extra
 * points near special band boundaries for smooth clipping transitions.
 */
const verticalLineSamples = (zone, e, n0, n1, steps) => {
  // Generate regular samples
  const northings = new Set()
  for (let s = 0; s <= steps; s++) {
    northings.add(n0 + (n1 - n0) * (s / steps))
  }

  // Add extra samples near special band boundaries
  for (const lat of SPECIAL_BAND_LATS) {
    // Convert lat to approximate northing using a mid-zone easting
    const ll = (() => {
      try {
        const p = new LatLon(lat, (zone - 1) * 6 - 180 + 3)
        const utm = p.toUtm()
        return utm.northing
      } catch (_) { return null }
    })()
    if (ll === null || ll < n0 || ll > n1) continue

    // Add points at, just below, and just above the boundary
    const delta = (n1 - n0) / steps / 4 // quarter step
    for (const offset of [-delta, 0, delta]) {
      const n = ll + offset
      if (n >= n0 && n <= n1) northings.add(n)
    }
  }

  // Sort and generate lon/lat points
  const sorted = [...northings].sort((a, b) => a - b)
  const points = []
  for (const n of sorted) {
    const lonlat = utmToLonLat(zone, 'N', e, n)
    if (lonlat && lonlat[1] >= LAT_MIN && lonlat[1] <= LAT_MAX) {
      points.push(lonlat)
    }
  }
  return points
}

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

/**
 * Clip an array of [lon, lat] points to a zone's longitude range,
 * where the zone bounds vary by latitude (special zones).
 * Each point is checked against getZoneBounds() at its latitude.
 */
const clipToZone = (points, zone) => {
  if (points.length < 2) return []

  const segments = []
  let current = []

  for (let i = 0; i < points.length; i++) {
    const [lon, lat] = points[i]
    const bounds = getZoneBounds(zone, lat)

    // If zone doesn't exist at this latitude, treat as outside
    if (!bounds) {
      if (current.length >= 2) segments.push(current)
      current = []
      continue
    }

    const [lonMin, lonMax] = bounds

    if (lon >= lonMin && lon <= lonMax) {
      if (current.length === 0 && i > 0) {
        const [pLon, pLat] = points[i - 1]
        const pBounds = getZoneBounds(zone, pLat)
        if (pBounds) {
          if (pLon < pBounds[0]) {
            const t = (lonMin - pLon) / (lon - pLon)
            current.push([lonMin, pLat + t * (lat - pLat)])
          } else if (pLon > pBounds[1]) {
            const t = (lonMax - pLon) / (lon - pLon)
            current.push([lonMax, pLat + t * (lat - pLat)])
          }
        }
      }
      current.push([lon, lat])
    } else {
      if (current.length > 0) {
        const [pLon, pLat] = points[i - 1]
        if (lon < lonMin) {
          const t = (lonMin - pLon) / (lon - pLon)
          current.push([lonMin, pLat + t * (lat - pLat)])
        } else if (lon > lonMax) {
          const t = (lonMax - pLon) / (lon - pLon)
          current.push([lonMax, pLat + t * (lat - pLat)])
        }
        segments.push(current)
        current = []
      }
    }
  }

  if (current.length >= 2) segments.push(current)
  return segments
}

// --- Grid Zone Designations (GZD) ---

/**
 * Generate GZD boundary features for the visible extent.
 * Handles Norway (band V) and Svalbard (band X) exceptions.
 */
const generateGZD = (lonMin, lonMax, latMin, latMax) => {
  const features = []

  const zoneStart = Math.max(1, utmZone(lonMin) - 1)
  const zoneEnd = Math.min(60, utmZone(lonMax) + 1)
  const effectiveLatMin = Math.max(LAT_MIN, latMin)
  const effectiveLatMax = Math.min(LAT_MAX, latMax)

  // Collect all unique zone boundary longitudes per band segment.
  // Each band may have different zone boundaries due to exceptions.
  const drawnLines = new Set() // track "lon:latMin:latMax" to avoid duplicates

  for (let bi = 0; bi < BAND_LETTERS.length; bi++) {
    const bandLatMin = LAT_MIN + bi * 8
    const bandLatMax = bi === BAND_LETTERS.length - 1 ? LAT_MAX : bandLatMin + 8

    // Skip bands outside view
    if (bandLatMax < effectiveLatMin || bandLatMin > effectiveLatMax) continue

    const segLatMin = Math.max(effectiveLatMin, bandLatMin)
    const segLatMax = Math.min(effectiveLatMax, bandLatMax)

    for (let z = zoneStart; z <= zoneEnd + 1; z++) {
      // Get the left boundary of this zone in this band
      const bounds = getZoneBounds(z, (bandLatMin + bandLatMax) / 2)
      if (!bounds) continue

      const lon = bounds[0]
      if (lon < lonMin - 6 || lon > lonMax + 6) continue

      const key = `${lon.toFixed(2)}:${segLatMin}:${segLatMax}`
      if (drawnLines.has(key)) continue
      drawnLines.add(key)

      const coords = interpolateLine(
        [[lon, segLatMin], [lon, segLatMax]],
        GZD_STEPS
      )
      if (coords.length >= 2) {
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(gzdStyle)
        f.set('level', 'gzd')
        features.push(f)
      }

      // Also draw the right boundary of the last zone in view
      if (z === zoneEnd + 1 || z === 60) {
        const rLon = bounds[1]
        const rKey = `${rLon.toFixed(2)}:${segLatMin}:${segLatMax}`
        if (!drawnLines.has(rKey) && rLon >= lonMin - 6 && rLon <= lonMax + 6) {
          drawnLines.add(rKey)
          const rCoords = interpolateLine(
            [[rLon, segLatMin], [rLon, segLatMax]],
            GZD_STEPS
          )
          if (rCoords.length >= 2) {
            const rf = new Feature({ geometry: new LineString(rCoords) })
            rf.setStyle(gzdStyle)
            rf.set('level', 'gzd')
            features.push(rf)
          }
        }
      }
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

  // Zone labels — use actual zone bounds for label placement
  for (let z = zoneStart; z <= zoneEnd; z++) {
    for (let bi = 0; bi < BAND_LETTERS.length; bi++) {
      const bandLatMin = LAT_MIN + bi * 8
      const bandLatMax = bi === BAND_LETTERS.length - 1 ? LAT_MAX : bandLatMin + 8
      const latCenter = (bandLatMin + bandLatMax) / 2

      if (latCenter < effectiveLatMin || latCenter > effectiveLatMax) continue

      const bounds = getZoneBounds(z, latCenter)
      if (!bounds) continue // zone doesn't exist in this band

      const lonCenter = (bounds[0] + bounds[1]) / 2
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
    // Compute widest longitude bounds for this zone across all visible bands
    // Use standard 6° zone bounds for grid generation.
    // clipToZone() handles per-latitude clipping for special zones.
    const zoneLonMin = (z - 1) * 6 - 180
    const zoneLonMax = zoneLonMin + 6
    const visibleLatMin = Math.max(latMin, LAT_MIN)
    const visibleLatMax = Math.min(latMax, LAT_MAX)

    const visibleLonMin = Math.max(lonMin, zoneLonMin)
    const visibleLonMax = Math.min(lonMax, zoneLonMax)

    const sampleLons = [visibleLonMin, visibleLonMax, (visibleLonMin + visibleLonMax) / 2]
    const sampleLats = [visibleLatMin, visibleLatMax, (visibleLatMin + visibleLatMax) / 2]

    let minN = Infinity; let maxN = -Infinity

    for (const lon of sampleLons) {
      for (const lat of sampleLats) {
        try {
          const ll = new LatLon(lat, lon)
          const utm = ll.toUtm()
          if (Math.abs(utm.zone - z) <= 1) {
            minN = Math.min(minN, utm.northing)
            maxN = Math.max(maxN, utm.northing)
          }
        } catch (e) { /* skip invalid coords */ }
      }
    }

    if (minN === Infinity) continue

    const e0 = 100000
    const e1 = 900000
    const n0 = Math.floor(minN / 100000) * 100000
    const n1 = Math.ceil(maxN / 100000) * 100000

    // Vertical lines (constant easting)
    for (let e = e0; e <= e1; e += 100000) {
      const rawPoints = verticalLineSamples(z, e, n0, n1, GRID_100K_STEPS)
      for (const seg of clipToZone(rawPoints, z)) {
        if (seg.length < 2) continue
        const coords = seg.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid100kStyle)
        f.set('level', '100k')
        features.push(f)
      }
    }

    // Horizontal lines (constant northing)
    for (let n = n0; n <= n1; n += 100000) {
      const rawPoints = []
      const hSteps = GRID_100K_STEPS * 2
      for (let s = 0; s <= hSteps; s++) {
        const e = e0 + (e1 - e0) * (s / hSteps)
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) rawPoints.push(ll)
      }
      for (const seg of clipToZone(rawPoints, z)) {
        if (seg.length < 2) continue
        const coords = seg.map(([lon, lat]) => toMapCoord(lon, lat))
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
        // Check against actual zone bounds at this latitude
        const labelBounds = getZoneBounds(z, ll[1])
        if (!labelBounds) continue
        if (ll[0] < labelBounds[0] || ll[0] > labelBounds[1]) continue
        if (ll[0] < lonMin || ll[0] > lonMax) continue
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
    const visibleLatMin = Math.max(latMin, LAT_MIN)
    const visibleLatMax = Math.min(latMax, LAT_MAX)
    const visibleLonMin = Math.max(lonMin, zoneLonMin)
    const visibleLonMax = Math.min(lonMax, zoneLonMax)

    const sampleLons = [visibleLonMin, visibleLonMax, (visibleLonMin + visibleLonMax) / 2]
    const sampleLats = [visibleLatMin, visibleLatMax, (visibleLatMin + visibleLatMax) / 2]

    let minN = Infinity; let maxN = -Infinity

    for (const lon of sampleLons) {
      for (const lat of sampleLats) {
        try {
          const ll = new LatLon(lat, lon)
          const utm = ll.toUtm()
          if (Math.abs(utm.zone - z) <= 1) {
            minN = Math.min(minN, utm.northing)
            maxN = Math.max(maxN, utm.northing)
          }
        } catch (e) { /* skip */ }
      }
    }

    if (minN === Infinity) continue

    // Estimate easting range from visible lon, with generous padding for zone edges
    let minE = Infinity; let maxE = -Infinity
    for (const lon of sampleLons) {
      for (const lat of sampleLats) {
        try {
          const ll = new LatLon(lat, lon)
          const utm = ll.toUtm()
          if (utm.zone === z) {
            minE = Math.min(minE, utm.easting)
            maxE = Math.max(maxE, utm.easting)
          }
        } catch (e) { /* skip */ }
      }
    }
    // If no samples fell in this zone, use full range
    if (minE === Infinity) { minE = 100000; maxE = 900000 }
    // Pad by 20km to avoid gaps at zone edges
    const e0 = Math.max(100000, Math.floor((minE - 20000) / 10000) * 10000)
    const e1 = Math.min(900000, Math.ceil((maxE + 20000) / 10000) * 10000)
    const n0 = Math.floor(minN / 10000) * 10000
    const n1 = Math.ceil(maxN / 10000) * 10000

    // Vertical lines (constant easting), skip 100k boundaries
    for (let e = e0; e <= e1; e += 10000) {
      if (e % 100000 === 0) continue
      const rawPoints = verticalLineSamples(z, e, n0, n1, GRID_10K_STEPS)
      for (const seg of clipToZone(rawPoints, z)) {
        if (seg.length < 2) continue
        const coords = seg.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid10kStyle)
        f.set('level', '10k')
        features.push(f)
      }
    }

    // Horizontal lines (constant northing), skip 100k boundaries
    for (let n = n0; n <= n1; n += 10000) {
      if (n % 100000 === 0) continue
      const rawPoints = []
      const hSteps = GRID_10K_STEPS * 2
      for (let s = 0; s <= hSteps; s++) {
        const e = e0 + (e1 - e0) * (s / hSteps)
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) rawPoints.push(ll)
      }
      for (const seg of clipToZone(rawPoints, z)) {
        if (seg.length < 2) continue
        const coords = seg.map(([lon, lat]) => toMapCoord(lon, lat))
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
        const lb = getZoneBounds(z, ll[1])
        if (!lb || ll[0] < lb[0] || ll[0] > lb[1]) continue
        if (ll[0] < lonMin || ll[0] > lonMax) continue
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
    const visibleLatMin = Math.max(latMin, LAT_MIN)
    const visibleLatMax = Math.min(latMax, LAT_MAX)
    const visibleLonMin = Math.max(lonMin, zoneLonMin)
    const visibleLonMax = Math.min(lonMax, zoneLonMax)

    const sampleLons = [visibleLonMin, visibleLonMax, (visibleLonMin + visibleLonMax) / 2]
    const sampleLats = [visibleLatMin, visibleLatMax, (visibleLatMin + visibleLatMax) / 2]

    let minN = Infinity; let maxN = -Infinity

    for (const lon of sampleLons) {
      for (const lat of sampleLats) {
        try {
          const ll = new LatLon(lat, lon)
          const utm = ll.toUtm()
          if (Math.abs(utm.zone - z) <= 1) {
            minN = Math.min(minN, utm.northing)
            maxN = Math.max(maxN, utm.northing)
          }
        } catch (e) { /* skip */ }
      }
    }

    if (minN === Infinity) continue

    let minE = Infinity; let maxE = -Infinity
    for (const lon of sampleLons) {
      for (const lat of sampleLats) {
        try {
          const ll = new LatLon(lat, lon)
          const utm = ll.toUtm()
          if (utm.zone === z) {
            minE = Math.min(minE, utm.easting)
            maxE = Math.max(maxE, utm.easting)
          }
        } catch (e) { /* skip */ }
      }
    }
    if (minE === Infinity) { minE = 100000; maxE = 900000 }
    const e0 = Math.max(100000, Math.floor((minE - 2000) / 1000) * 1000)
    const e1 = Math.min(900000, Math.ceil((maxE + 2000) / 1000) * 1000)
    const n0 = Math.floor(minN / 1000) * 1000
    const n1 = Math.ceil(maxN / 1000) * 1000

    // Vertical lines (constant easting), skip 10k/100k boundaries
    for (let e = e0; e <= e1; e += 1000) {
      if (e % 10000 === 0) continue
      const rawPoints = verticalLineSamples(z, e, n0, n1, GRID_1K_STEPS)
      for (const seg of clipToZone(rawPoints, z)) {
        if (seg.length < 2) continue
        const coords = seg.map(([lon, lat]) => toMapCoord(lon, lat))
        const f = new Feature({ geometry: new LineString(coords) })
        f.setStyle(grid1kStyle)
        f.set('level', '1k')
        features.push(f)
      }
    }

    // Horizontal lines (constant northing), skip 10k/100k boundaries
    for (let n = n0; n <= n1; n += 1000) {
      if (n % 10000 === 0) continue
      const rawPoints = []
      for (let s = 0; s <= GRID_1K_STEPS; s++) {
        const e = e0 + (e1 - e0) * (s / GRID_1K_STEPS)
        const ll = utmToLonLat(z, 'N', e, n)
        if (ll && ll[1] >= LAT_MIN && ll[1] <= LAT_MAX) rawPoints.push(ll)
      }
      for (const seg of clipToZone(rawPoints, z)) {
        if (seg.length < 2) continue
        const coords = seg.map(([lon, lat]) => toMapCoord(lon, lat))
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
        const lb1k = getZoneBounds(z, ll[1])
        if (!lb1k || ll[0] < lb1k[0] || ll[0] > lb1k[1]) continue
        if (ll[0] < lonMin || ll[0] > lonMax) continue
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
