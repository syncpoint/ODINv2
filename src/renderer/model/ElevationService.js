import { getLength } from 'ol/sphere'

const MAX_CACHE_SIZE = 200

const elevation = rgb => {
  if (!rgb) return null
  const value = -10000 + (((rgb[0] << 16) + (rgb[1] << 8) + rgb[2]) * 0.1)
  if (value === -10000) return null
  return value
}

/**
 * Viewport-independent elevation sampling from terrain tiles.
 * Fetches XYZ tile images directly and decodes RGB-encoded elevation.
 * Reusable by future viewshed feature.
 */
export function ElevationService () {
  this.source_ = null
  this.tileGrid_ = null
  this.tileUrlTemplate_ = null
  this.tileCache_ = new Map()
}

/**
 * Discovers terrain layer from the map and extracts source + tileGrid.
 * @param {import('ol/Map').default} map
 * @returns {boolean} true if a terrain source was found
 */
ElevationService.prototype.setSource = function (map) {
  const terrainLayers = map.getLayerGroup().getLayersArray()
    .filter(l => l.get('contentType') === 'terrain/mapbox-rgb')

  if (terrainLayers.length === 0) return false

  const layer = terrainLayers[0]
  const source = layer.getSource()
  this.source_ = source
  this.tileGrid_ = source.getTileGrid()
  this.tileUrlTemplate_ = source.getUrls()[0]
  return true
}

/**
 * Build tile URL from template and tile coordinate.
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
ElevationService.prototype.tileUrl_ = function (z, x, y) {
  return this.tileUrlTemplate_
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y)
}

/**
 * Fetch a tile and return its ImageData (cached).
 * @param {string} key - cache key "z/x/y"
 * @param {string} url - tile URL
 * @returns {Promise<ImageData|null>}
 */
ElevationService.prototype.fetchTile_ = async function (key, url) {
  if (this.tileCache_.has(key)) return this.tileCache_.get(key)

  try {
    const imageData = await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = new OffscreenCanvas(256, 256)
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        resolve(ctx.getImageData(0, 0, 256, 256))
      }
      img.onerror = () => reject(new Error(`Failed to load tile: ${url}`))
      img.src = url
    })

    // LRU eviction: remove oldest entry if cache is full
    if (this.tileCache_.size >= MAX_CACHE_SIZE) {
      const firstKey = this.tileCache_.keys().next().value
      this.tileCache_.delete(firstKey)
    }
    this.tileCache_.set(key, imageData)
    return imageData
  } catch {
    return null
  }
}

/**
 * Get elevation at a single coordinate.
 * @param {import('ol/coordinate').Coordinate} coordinate - in map projection
 * @param {number} zoom
 * @returns {Promise<number|null>}
 */
ElevationService.prototype.elevationAt = async function (coordinate, zoom) {
  if (!this.source_) return null

  const z = Math.round(zoom)
  const tileCoord = this.tileGrid_.getTileCoordForCoordAndZ(coordinate, z)
  const [tz, tx, ty] = tileCoord
  const key = `${tz}/${tx}/${ty}`
  const url = this.tileUrl_(tz, tx, ty)

  const imageData = await this.fetchTile_(key, url)
  if (!imageData) return null

  // Calculate pixel offset within tile
  const tileOrigin = this.tileGrid_.getTileCoordExtent(tileCoord)
  const tileSize = 256
  const resolution = (tileOrigin[2] - tileOrigin[0]) / tileSize

  const px = Math.floor((coordinate[0] - tileOrigin[0]) / resolution)
  const py = Math.floor((tileOrigin[3] - coordinate[1]) / resolution)

  // Clamp to tile bounds
  const cx = Math.max(0, Math.min(tileSize - 1, px))
  const cy = Math.max(0, Math.min(tileSize - 1, py))

  const offset = (cy * tileSize + cx) * 4
  const rgb = [imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2]]
  return elevation(rgb)
}

/**
 * Get elevations at multiple coordinates (batch, for future viewshed).
 * @param {Array<import('ol/coordinate').Coordinate>} coordinates
 * @param {number} zoom
 * @returns {Promise<Array<number|null>>}
 */
ElevationService.prototype.elevationsAt = async function (coordinates, zoom) {
  return Promise.all(coordinates.map(c => this.elevationAt(c, zoom)))
}

/**
 * Sample elevation profile along a LineString geometry.
 * @param {import('ol/geom/LineString').default} lineStringGeom - in map projection
 * @param {number} numSamples
 * @param {number} zoom
 * @returns {Promise<Array<{distance: number, elevation: number|null, coordinate: import('ol/coordinate').Coordinate}>>}
 */
ElevationService.prototype.profileAlongLine = async function (lineStringGeom, numSamples, zoom) {
  const totalLength = getLength(lineStringGeom)
  if (totalLength === 0 || numSamples < 2) return []

  const results = []
  for (let i = 0; i < numSamples; i++) {
    const fraction = i / (numSamples - 1)
    const coordinate = lineStringGeom.getCoordinateAt(fraction)
    const distance = totalLength * fraction
    const elev = await this.elevationAt(coordinate, zoom)
    results.push({ distance, elevation: elev, coordinate })
  }

  return results
}
