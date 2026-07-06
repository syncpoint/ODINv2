import assert from 'assert'
import {
  viewshedCPU,
  maskWindow,
  VISIBLE,
  HIDDEN,
  NO_DATA
} from '../../src/renderer/ol/interaction/area-of-sight/engine'

const makeGrid = (size, elevation) => ({
  data: new Float32Array(size * size).fill(elevation),
  width: size,
  height: size
})

const params = overrides => ({
  ox: 50,
  oy: 50,
  radius: 40,
  metersPerCell: 10,
  observerHeight: 2,
  targetHeight: 2,
  ...overrides
})

const at = (result, x, y) => result.mask[(y - result.y0) * result.w + (x - result.x0)]

describe('viewshedCPU', function () {
  it('sees everything on flat terrain', function () {
    const grid = makeGrid(101, 100)
    const result = viewshedCPU(grid, params())

    assert.strictEqual(result.w, 81)
    assert.strictEqual(result.h, 81)
    let hidden = 0
    let visible = 0
    for (const value of result.mask) {
      if (value === HIDDEN) hidden++
      else if (value === VISIBLE) visible++
    }
    assert.strictEqual(hidden, 0, 'no cell is hidden on a flat plane')
    assert.ok(visible > 0.9 * result.mask.length, 'nearly all cells are covered by rays')
  })

  it('hides cells behind a wall, wall itself stays visible', function () {
    const grid = makeGrid(101, 100)
    for (let y = 0; y < 101; y++) grid.data[y * 101 + 60] = 200 // N-S wall at x=60

    const result = viewshedCPU(grid, params())

    assert.strictEqual(at(result, 55, 50), VISIBLE, 'before the wall')
    assert.strictEqual(at(result, 60, 50), VISIBLE, 'target on top of the wall')
    assert.strictEqual(at(result, 70, 50), HIDDEN, 'behind the wall')
    assert.strictEqual(at(result, 40, 50), VISIBLE, 'opposite direction unaffected')
  })

  it('treats no-data cells as neither visible nor blocking', function () {
    const grid = makeGrid(101, 100)
    grid.data[50 * 101 + 55] = NO_DATA

    const result = viewshedCPU(grid, params())

    assert.strictEqual(at(result, 55, 50), 0, 'no-data cell is unclassified')
    assert.strictEqual(at(result, 60, 50), VISIBLE, 'cell behind no-data is still visible')
  })

  it('returns null when the observer has no elevation data', function () {
    const grid = makeGrid(101, 100)
    grid.data[50 * 101 + 50] = NO_DATA
    assert.strictEqual(viewshedCPU(grid, params()), null)
  })

  it('clamps the mask window to the grid', function () {
    const window = maskWindow(101, 101, 10, 10, 40)
    assert.deepStrictEqual(window, { x0: 0, y0: 0, w: 51, h: 51 })
  })
})
