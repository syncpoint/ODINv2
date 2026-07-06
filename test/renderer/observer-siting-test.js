import assert from 'assert'
import {
  rasterizePolygon,
  findCandidates,
  greedySiting
} from '../../src/renderer/ol/interaction/observer-siting/solve'
import { viewshedCPU, VISIBLE } from '../../src/renderer/ol/interaction/area-of-sight/engine'

describe('observer siting', function () {
  describe('rasterizePolygon', function () {
    it('fills a rectangle', function () {
      const rings = [[[10, 10], [30, 10], [30, 20], [10, 20]]]
      const { mask, cells } = rasterizePolygon(rings, 40, 30)
      assert.strictEqual(cells, 20 * 10)
      assert.strictEqual(mask[15 * 40 + 20], 1, 'inside')
      assert.strictEqual(mask[5 * 40 + 20], 0, 'above')
      assert.strictEqual(mask[15 * 40 + 35], 0, 'right of it')
    })

    it('supports holes via even-odd rule', function () {
      const rings = [
        [[0, 0], [40, 0], [40, 40], [0, 40]],
        [[10, 10], [30, 10], [30, 30], [10, 30]]
      ]
      const { mask } = rasterizePolygon(rings, 40, 40)
      assert.strictEqual(mask[20 * 40 + 20], 0, 'inside the hole')
      assert.strictEqual(mask[5 * 40 + 5], 1, 'between outer ring and hole')
    })
  })

  describe('findCandidates', function () {
    const grid = (width, height, fn) => {
      const data = new Float32Array(width * height)
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) data[y * width + x] = fn(x, y)
      return { data, width, height }
    }
    const everywhere = (width, height) => new Uint8Array(width * height).fill(1)

    it('finds the two hill tops, highest first', function () {
      const hill = (x, y, cx, cy, h) => h * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / 50)
      const g = grid(100, 40, (x, y) => hill(x, y, 25, 20, 100) + hill(x, y, 75, 20, 80))
      const candidates = findCandidates(g, everywhere(100, 40), { minSpacing: 10, maxCandidates: 10 })

      assert.ok(candidates.length >= 2)
      assert.ok(Math.abs(candidates[0].x - 25) <= 1 && Math.abs(candidates[0].y - 20) <= 1, 'highest hill first')
      assert.ok(candidates.some(c => Math.abs(c.x - 75) <= 1 && Math.abs(c.y - 20) <= 1), 'second hill found')
    })

    it('keeps minimum spacing between candidates', function () {
      const g = grid(60, 60, (x, y) => 100 - (x + y) * 0.001) // near-flat ridge
      const candidates = findCandidates(g, everywhere(60, 60), { minSpacing: 15, maxCandidates: 20 })
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const dx = candidates[i].x - candidates[j].x
          const dy = candidates[i].y - candidates[j].y
          assert.ok(dx * dx + dy * dy >= 15 * 15, 'spacing respected')
        }
      }
    })

    it('falls back to a lattice on flat terrain', function () {
      const g = grid(60, 60, () => 100)
      const candidates = findCandidates(g, everywhere(60, 60), { minSpacing: 10, maxCandidates: 30 })
      assert.ok(candidates.length >= 8, `expected lattice fallback, got ${candidates.length}`)
    })
  })

  describe('greedySiting', function () {
    const covers = indices => {
      const mask = new Uint8Array(100)
      indices.forEach(i => { mask[i] = 1 })
      return mask
    }
    const range = (from, to) => Array.from({ length: to - from }, (_, i) => from + i)

    it('picks the minimal covering set, largest gain first', function () {
      const viewsheds = [
        { candidate: 'A', covers: covers(range(0, 60)) },
        { candidate: 'B', covers: covers(range(60, 100)) },
        { candidate: 'C', covers: covers(range(20, 70)) } // redundant given A+B
      ]
      const result = greedySiting({
        areaCells: 100, viewsheds, targetCoverage: 1, maxObservers: 5, minGain: 0.01
      })
      assert.deepStrictEqual(result.picks.map(p => p.candidate), ['A', 'B'])
      assert.strictEqual(result.coverage, 1)
    })

    it('stops at the coverage target', function () {
      const viewsheds = [
        { candidate: 'A', covers: covers(range(0, 80)) },
        { candidate: 'B', covers: covers(range(80, 90)) },
        { candidate: 'C', covers: covers(range(90, 100)) }
      ]
      const result = greedySiting({
        areaCells: 100, viewsheds, targetCoverage: 0.75, maxObservers: 5, minGain: 0.01
      })
      assert.strictEqual(result.picks.length, 1)
    })

    it('stops when the remaining gain is negligible', function () {
      const viewsheds = [
        { candidate: 'A', covers: covers(range(0, 90)) },
        { candidate: 'B', covers: covers(range(89, 91)) } // adds 1 cell = 1 %
      ]
      const result = greedySiting({
        areaCells: 100, viewsheds, targetCoverage: 1, maxObservers: 5, minGain: 0.05
      })
      assert.deepStrictEqual(result.picks.map(p => p.candidate), ['A'])
    })

    it('respects the observer limit', function () {
      const viewsheds = range(0, 10).map(i => ({ candidate: i, covers: covers(range(i * 10, i * 10 + 10)) }))
      const result = greedySiting({
        areaCells: 100, viewsheds, targetCoverage: 1, maxObservers: 3, minGain: 0.01
      })
      assert.strictEqual(result.picks.length, 3)
    })
  })

  describe('end to end on synthetic terrain', function () {
    it('two hills separated by a deep valley need two observers', function () {
      // 200×80 grid: two 150 m hills at x=50 and x=150, valley floor at 0
      const width = 200
      const height = 80
      const data = new Float32Array(width * height)
      const hill = (x, y, cx, cy) => 150 * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / 400)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data[y * width + x] = hill(x, y, 50, 40) + hill(x, y, 150, 40)
        }
      }
      const grid = { data, width, height }

      const rings = [[[10, 10], [190, 10], [190, 70], [10, 70]]]
      const { mask: inArea, cells } = rasterizePolygon(rings, width, height)

      const candidates = findCandidates(grid, inArea, { minSpacing: 20, maxCandidates: 20 })

      const viewsheds = candidates.map(candidate => {
        const result = viewshedCPU(grid, {
          ox: candidate.x,
          oy: candidate.y,
          radius: 250,
          metersPerCell: 10,
          observerHeight: 2,
          targetHeight: 2
        })
        const covers = new Uint8Array(width * height)
        if (result) {
          for (let y = 0; y < result.h; y++) {
            for (let x = 0; x < result.w; x++) {
              const idx = (result.y0 + y) * width + (result.x0 + x)
              if (inArea[idx] && result.mask[y * result.w + x] === VISIBLE) covers[idx] = 1
            }
          }
        }
        return { candidate, covers }
      })

      const result = greedySiting({
        areaCells: cells, viewsheds, targetCoverage: 0.95, maxObservers: 8, minGain: 0.01
      })

      assert.ok(result.picks.length >= 2, 'one observer cannot see behind the other hill')
      assert.ok(result.coverage > 0.8, `expected high coverage, got ${result.coverage.toFixed(2)}`)
      // the two hill tops should be among the picks
      const near = (pick, cx) => Math.abs(pick.candidate.x - cx) <= 5
      assert.ok(result.picks.some(p => near(p, 50)), 'west hill picked')
      assert.ok(result.picks.some(p => near(p, 150)), 'east hill picked')
    })
  })
})
