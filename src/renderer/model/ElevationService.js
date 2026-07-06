import { getLength } from 'ol/sphere'

const MAX_CACHE_SIZE = 200 // decoded tiles à 256 KB → ≤ 50 MB
const TILE_SIZE = 256

// Elevation analysis samples at a fixed, data-driven zoom so results are
// deterministic — independent of the current view zoom. Finest zoom whose
// resolution is at or above this value is used (Mapbox Terrain-RGB z14
// ≈ 9.6 m at the equator).
const TARGET_ANALYSIS_RESOLUTION = 15

// Upper bound for stitched grids (getGrid); ~80 MB Float32. The zoom is
// coarsened until the requested extent fits.
const MAX_GRID_CELLS = 20e6

/**
 * Decode one Mapbox Terrain-RGB tile into elevations [m].
 * No-data pixels become NaN.
 */
const decodeTile = imageData => {
  const rgba = imageData.data
  const elevations = new Float32Array(TILE_SIZE * TILE_SIZE)
  for (let i = 0; i < elevations.length; i++) {
    const o = i * 4
    const value = -10000 + (((rgba[o] << 16) + (rgba[o + 1] << 8) + rgba[o + 2]) * 0.1)
    elevations[i] = value === -10000 ? NaN : value
  }
  return elevations
}

/**
 * Viewport-independent elevation sampling from terrain tiles.
 * Fetches XYZ tile images directly and decodes RGB-encoded elevation
 * into Float32 arrays. Shared foundation for elevation profile,
 * Line-of-Sight and Area-of-Sight (viewshed).
 */
export function ElevationService () {
  this.source_ = null
  this.tileGrid_ = null
  this.tileUrlFunction_ = null
  this.tileCache_ = new Map() // 'z/x/y' -> Promise<Float32Array|null>
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
  if (source !== this.source_) this.tileCache_.clear()
  this.source_ = source
  this.tileGrid_ = source.getTileGrid()
  this.tileUrlFunction_ = source.getTileUrlFunction()
  return true
}

/**
 * Fixed zoom used for all analysis sampling: the coarsest zoom that still
 * resolves TARGET_ANALYSIS_RESOLUTION, clamped to the tile grid's range.
 * @returns {number|null}
 */
ElevationService.prototype.analysisZoom = function () {
  if (!this.tileGrid_) return null
  const minZ = this.tileGrid_.getMinZoom()
  const maxZ = this.tileGrid_.getMaxZoom()
  for (let z = minZ; z <= maxZ; z++) {
    if (this.tileGrid_.getResolution(z) <= TARGET_ANALYSIS_RESOLUTION) return z
  }
  return maxZ
}

/**
 * Cell size [projection units ≈ m] at the analysis zoom.
 * @returns {number|null}
 */
ElevationService.prototype.analysisResolution = function () {
  const z = this.analysisZoom()
  return z === null ? null : this.tileGrid_.getResolution(z)
}

/**
 * Fetch and decode a tile (promise-cached, so concurrent requests for
 * the same tile share one download).
 * @returns {Promise<Float32Array|null>}
 */
ElevationService.prototype.fetchTile_ = function (z, x, y) {
  const key = `${z}/${x}/${y}`
  if (this.tileCache_.has(key)) {
    const hit = this.tileCache_.get(key)
    this.tileCache_.delete(key) // LRU: re-insert as most recent
    this.tileCache_.set(key, hit)
    return hit
  }

  const url = this.tileUrlFunction_([z, x, y], 1, this.source_.getProjection())
  const promise = !url
    ? Promise.resolve(null)
    : new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE)
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        resolve(decodeTile(ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE)))
      }
      img.onerror = () => reject(new Error(`Failed to load tile: ${url}`))
      img.src = url
    }).catch(() => {
      this.tileCache_.delete(key) // do not cache failures
      return null
    })

  if (this.tileCache_.size >= MAX_CACHE_SIZE) {
    const oldest = this.tileCache_.keys().next().value
    this.tileCache_.delete(oldest)
  }
  this.tileCache_.set(key, promise)
  return promise
}

/**
 * Sample a decoded tile at a coordinate.
 * @returns {number|null}
 */
ElevationService.prototype.sample_ = function (elevations, tileCoord, coordinate) {
  const extent = this.tileGrid_.getTileCoordExtent(tileCoord)
  const resolution = (extent[2] - extent[0]) / TILE_SIZE
  const px = Math.max(0, Math.min(TILE_SIZE - 1, Math.floor((coordinate[0] - extent[0]) / resolution)))
  const py = Math.max(0, Math.min(TILE_SIZE - 1, Math.floor((extent[3] - coordinate[1]) / resolution)))
  const value = elevations[py * TILE_SIZE + px]
  return Number.isNaN(value) ? null : value
}

/**
 * Get elevation at a single coordinate (at the analysis zoom).
 * @param {import('ol/coordinate').Coordinate} coordinate - in map projection
 * @returns {Promise<number|null>}
 */
ElevationService.prototype.elevationAt = async function (coordinate) {
  if (!this.source_) return null
  const z = this.analysisZoom()
  const tileCoord = this.tileGrid_.getTileCoordForCoordAndZ(coordinate, z)
  const elevations = await this.fetchTile_(...tileCoord)
  return elevations ? this.sample_(elevations, tileCoord, coordinate) : null
}

/**
 * Sample elevation profile along a LineString geometry. Required tiles
 * are fetched in parallel, then all samples are read synchronously.
 * @param {import('ol/geom/LineString').default} lineStringGeom - in map projection
 * @param {number} numSamples
 * @returns {Promise<Array<{distance: number, elevation: number|null, coordinate: import('ol/coordinate').Coordinate}>>}
 */
ElevationService.prototype.profileAlongLine = async function (lineStringGeom, numSamples) {
  if (!this.source_) return []
  const totalLength = getLength(lineStringGeom)
  if (totalLength === 0 || numSamples < 2) return []

  const z = this.analysisZoom()
  const samples = []
  for (let i = 0; i < numSamples; i++) {
    const fraction = i / (numSamples - 1)
    const coordinate = lineStringGeom.getCoordinateAt(fraction)
    const tileCoord = this.tileGrid_.getTileCoordForCoordAndZ(coordinate, z)
    samples.push({ distance: totalLength * fraction, coordinate, tileCoord })
  }

  const tiles = new Map() // 'z/x/y' -> Float32Array|null
  const unique = [...new Map(samples.map(s => [s.tileCoord.join('/'), s.tileCoord])).values()]
  await Promise.all(unique.map(async tileCoord => {
    tiles.set(tileCoord.join('/'), await this.fetchTile_(...tileCoord))
  }))

  return samples.map(({ distance, coordinate, tileCoord }) => {
    const elevations = tiles.get(tileCoord.join('/'))
    const elevation = elevations ? this.sample_(elevations, tileCoord, coordinate) : null
    return { distance, elevation, coordinate }
  })
}

/**
 * Stitch a tile-aligned elevation grid covering the extent (for viewshed).
 * The zoom starts at the analysis zoom and is coarsened until the grid
 * fits MAX_GRID_CELLS. Missing tiles yield NaN cells.
 *
 * @param {import('ol/extent').Extent} extent - in map projection
 * @returns {Promise<null | {
 *   data: Float32Array, width: number, height: number,
 *   origin: number[],           // top-left corner [x, y]
 *   resolution: number,         // cell size in projection units
 *   zoom: number
 * }>}
 */
ElevationService.prototype.getGrid = async function (extent) {
  if (!this.source_) return null

  let z = this.analysisZoom()
  const minZ = this.tileGrid_.getMinZoom()
  const rangeFor = z => this.tileGrid_.getTileRangeForExtentAndZ(extent, z)
  let range = rangeFor(z)
  const cells = r => (r.getWidth() * TILE_SIZE) * (r.getHeight() * TILE_SIZE)
  while (cells(range) > MAX_GRID_CELLS && z > minZ) {
    z -= 1
    range = rangeFor(z)
  }
  if (cells(range) > MAX_GRID_CELLS) return null

  const cols = range.getWidth()
  const rows = range.getHeight()
  const width = cols * TILE_SIZE
  const height = rows * TILE_SIZE
  const data = new Float32Array(width * height).fill(NaN)

  const jobs = []
  for (let ty = range.minY; ty <= range.maxY; ty++) {
    for (let tx = range.minX; tx <= range.maxX; tx++) {
      jobs.push(
        this.fetchTile_(z, tx, ty).then(elevations => {
          if (!elevations) return
          const dx = (tx - range.minX) * TILE_SIZE
          const dy = (ty - range.minY) * TILE_SIZE
          for (let row = 0; row < TILE_SIZE; row++) {
            data.set(
              elevations.subarray(row * TILE_SIZE, (row + 1) * TILE_SIZE),
              (dy + row) * width + dx
            )
          }
        })
      )
    }
  }
  await Promise.all(jobs)

  const topLeft = this.tileGrid_.getTileCoordExtent([z, range.minX, range.minY])
  return {
    data,
    width,
    height,
    origin: [topLeft[0], topLeft[3]],
    resolution: this.tileGrid_.getResolution(z),
    zoom: z
  }
}
