import assert from 'assert'
import LineString from 'ol/geom/LineString'
import TileGrid from 'ol/tilegrid/TileGrid'
import { ElevationService } from '../../../src/renderer/model/ElevationService'

// Web-Mercator-like tile grid: z0 = one 256px world tile.
const WORLD = 40075016.68557849
const EXTENT = [-WORLD / 2, -WORLD / 2, WORLD / 2, WORLD / 2]
const resolutions = Array.from({ length: 16 }, (_, z) => WORLD / 256 / Math.pow(2, z))

const makeTileGrid = () => new TileGrid({
  extent: EXTENT,
  origin: [-WORLD / 2, WORLD / 2],
  resolutions,
  tileSize: 256
})

// Service with stubbed tile fetch: every tile is a flat plane whose
// elevation encodes its tile coordinate (x * 1e3 + y — small enough to
// stay exactly representable in Float32).
const makeService = (fetched = []) => {
  const service = new ElevationService()
  service.source_ = {}
  service.tileGrid_ = makeTileGrid()
  service.fetchTile_ = async (z, x, y) => {
    fetched.push(`${z}/${x}/${y}`)
    return new Float32Array(256 * 256).fill(x * 1e3 + y)
  }
  return service
}

describe('ElevationService', function () {
  describe('analysisZoom', function () {
    it('picks the coarsest zoom at or below the target resolution', function () {
      const service = makeService()
      const z = service.analysisZoom()
      // resolutions: z13 ≈ 19.1 m > 15 m, z14 ≈ 9.55 m ≤ 15 m
      assert.strictEqual(z, 14)
    })

    it('falls back to maxZoom when no zoom reaches the target', function () {
      const service = makeService()
      service.tileGrid_ = new TileGrid({
        extent: EXTENT,
        origin: [-WORLD / 2, WORLD / 2],
        resolutions: resolutions.slice(0, 11), // max z10 ≈ 152 m
        tileSize: 256
      })
      assert.strictEqual(service.analysisZoom(), 10)
    })
  })

  describe('profileAlongLine', function () {
    it('samples at the analysis zoom and fetches each tile once', async function () {
      const fetched = []
      const service = makeService(fetched)
      const line = new LineString([[0, 0], [5000, 0]])

      const profile = await service.profileAlongLine(line, 50)

      assert.strictEqual(profile.length, 50)
      assert.strictEqual(profile[0].distance, 0)
      assert.ok(profile.every(s => typeof s.elevation === 'number'))
      assert.ok(fetched.every(key => key.startsWith('14/')))
      assert.strictEqual(new Set(fetched).size, fetched.length, 'no duplicate tile fetches')
    })
  })

  describe('getGrid', function () {
    it('stitches tiles into one grid with top-left origin', async function () {
      const service = makeService()
      const resolution = resolutions[14]
      // extent spanning 2×2 tiles at z14, top-right of world center
      const tile = 256 * resolution
      const extent = [100, 100, 100 + 1.5 * tile, 100 + 1.5 * tile]

      const grid = await service.getGrid(extent)

      assert.strictEqual(grid.zoom, 14)
      assert.strictEqual(grid.width, 512)
      assert.strictEqual(grid.height, 512)
      assert.strictEqual(grid.resolution, resolution)

      // Cells carry their source tile's coordinate: rows 0..255 come from
      // the northern tile row (smaller XYZ y), columns 0..255 from the
      // western column.
      const nw = grid.data[0]
      const ne = grid.data[511]
      const sw = grid.data[511 * 512]
      assert.strictEqual(ne - nw, 1000, 'east neighbour tile has x+1')
      assert.strictEqual(sw - nw, 1, 'south neighbour tile has y+1')

      // origin is the top-left (north-west) corner of the stitched extent
      const [ox, oy] = grid.origin
      assert.ok(ox <= 100)
      assert.ok(oy >= 100 + 1.5 * tile)
    })

    it('coarsens the zoom when the extent exceeds the cell budget', async function () {
      const service = makeService()
      // 100 × 100 tiles at z14 → 655M cells → must drop several zoom levels
      const tile = 256 * resolutions[14]
      const extent = [0, 0, 100 * tile, 100 * tile]

      const grid = await service.getGrid(extent)

      assert.ok(grid.zoom < 14)
      assert.ok(grid.width * grid.height <= 20e6)
    })
  })
})
