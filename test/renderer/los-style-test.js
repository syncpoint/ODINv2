import assert from 'assert'
import Signal from '@syncpoint/signal'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import losStyle from '../../src/renderer/ol/style/los'
import aosStyle from '../../src/renderer/ol/style/aos'
import { setComputer } from '../../src/renderer/ol/style/losCompute'

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

const makeContext = (geometry, properties = {}) => ({
  properties: Signal.of(properties),
  geometry: Signal.of(geometry),
  selectionMode: Signal.of('default')
})

const fakeResult = () => {
  const samples = Array.from({ length: 11 }, (_, i) => ({
    distance: i * 100,
    elevation: 100,
    coordinate: [i * 100, 0]
  }))
  return {
    distance: 1000,
    samples,
    firstBlocker: { index: 5, distance: 500, coordinate: [500, 0], elevation: 200 },
    clipped: false
  }
}

describe('los style orchestrator', function () {
  afterEach(function () { setComputer(null) })

  it('emits a pending style immediately when no computer is available', function () {
    setComputer(null)
    const $ = makeContext(new LineString([[0, 0], [1000, 0]]))
    const emitted = []
    losStyle($, 'los:test-pending').on(styles => emitted.push(styles))

    assert.ok(emitted.length >= 1, 'initial style emitted synchronously')
    const styles = emitted[emitted.length - 1]
    // pending line + observer point
    assert.strictEqual(styles.length, 2)
  })

  it('restyles with segments once the profile computer delivers', async function () {
    setComputer(async () => fakeResult())
    const $ = makeContext(new LineString([[0, 0], [1000, 0]]))
    const emitted = []
    losStyle($, 'los:test-resolved').on(styles => emitted.push(styles))

    await tick()
    const styles = emitted[emitted.length - 1]
    // visible segment + blocked segment + blocker marker + observer point
    assert.strictEqual(styles.length, 4)
    const geometries = styles.map(s => s.getGeometry()?.getType())
    assert.deepStrictEqual(geometries, ['LineString', 'LineString', 'Point', 'Point'])
  })

  it('recomputes when terrain becomes available later (invalidator)', async function () {
    setComputer(null)
    const $ = makeContext(new LineString([[0, 0], [1000, 0]]))
    const emitted = []
    losStyle($, 'los:test-late-terrain').on(styles => emitted.push(styles))
    await tick()
    assert.strictEqual(emitted[emitted.length - 1].length, 2, 'pending before terrain')

    setComputer(async () => fakeResult())
    await tick()
    assert.strictEqual(emitted[emitted.length - 1].length, 4, 'resolved after terrain arrived')
  })

  it('recomputes on geometry change', async function () {
    let calls = 0
    setComputer(async () => { calls++; return fakeResult() })
    const $ = makeContext(new LineString([[0, 0], [1000, 0]]))
    losStyle($, 'los:test-geometry').on(() => {})
    await tick()
    const before = calls
    $.geometry(new LineString([[0, 0], [2000, 0]]))
    await tick()
    assert.ok(calls > before, 'geometry change triggered recompute')
  })
})

describe('aos style orchestrator', function () {
  it('emits observer point and radius rim synchronously', function () {
    const $ = makeContext(new Point([1447153, 5955192]), { radius: 3000 }) // ~47°N
    const emitted = []
    aosStyle($).on(styles => emitted.push(styles))

    assert.ok(emitted.length >= 1)
    const styles = emitted[emitted.length - 1]
    assert.strictEqual(styles.length, 2)
    const circle = styles[0].getGeometry()
    assert.strictEqual(circle.getType(), 'Circle')
    // Mercator-inflated radius: 3000 / cos(47°) ≈ 4400
    assert.ok(circle.getRadius() > 4000 && circle.getRadius() < 4800)
  })
})
