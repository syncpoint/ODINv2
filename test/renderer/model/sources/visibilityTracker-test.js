import assert from 'assert'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Emitter from '../../../../src/shared/emitter'
import * as ID from '../../../../src/renderer/ids'
import { visibilityTracker } from '../../../../src/renderer/model/sources/visibilityTracker'

const feature = id => {
  const feature = new Feature(new Point([0, 0]))
  feature.setId(id)
  return feature
}

/* Minimal store: emits 'batch' and answers keys() with the hidden markers. */
const fakeStore = (hiddenKeys = []) => {
  const store = new Emitter()
  store.keys = async () => hiddenKeys
  return store
}

const ids = key => [key]

/* Emitter delivers handlers via setImmediate. */
const tick = () => new Promise(resolve => setImmediate(resolve))

describe('visibilityTracker', function () {

  it('shows features of a visible layer', async function () {
    const source = new VectorSource()
    const layerId = ID.layerId()
    const { visibleSource } = await visibilityTracker(source, fakeStore(), new Emitter())
    source.addFeature(feature(ID.featureId(layerId)))
    assert.equal(visibleSource.getFeatures().length, 1)
  })

  it('hides features arriving after the layer was hidden', async function () {
    const source = new VectorSource()
    const store = fakeStore()
    const layerId = ID.layerId()
    const { visibleSource, hiddenSource } = await visibilityTracker(source, store, new Emitter())

    // Hide layer with one feature present (what Store.hide writes).
    const first = ID.featureId(layerId)
    source.addFeature(feature(first))
    store.emit('batch', {
      operations: [
        { type: 'put', key: ID.hiddenId(layerId), value: true },
        { type: 'put', key: ID.hiddenId(first), value: true }
      ]
    })
    await tick()
    assert.equal(visibleSource.getFeatures().length, 0)
    assert.equal(hiddenSource.getFeatures().length, 1)

    // New feature arrives via store import (NIDO, replication): no own marker.
    const late = ID.featureId(layerId)
    source.addFeature(feature(late))
    assert.equal(visibleSource.getFeatures().length, 0, 'late feature must stay hidden')
    assert.equal(hiddenSource.getFeatures().length, 2)

    // Showing the layer again reveals both.
    store.emit('batch', {
      operations: [
        { type: 'del', key: ID.hiddenId(layerId) },
        { type: 'del', key: ID.hiddenId(first) }
      ]
    })
    await tick()
    assert.equal(visibleSource.getFeatures().length, 1, 'marked feature is touched back')
    // The late feature was never marked; it reappears on the next touch.
    source.dispatchEvent({ type: 'touchfeatures', keys: ids(late) })
    assert.equal(visibleSource.getFeatures().length, 2)
  })

  it('respects a layer hidden before the tracker started', async function () {
    const source = new VectorSource()
    const layerId = ID.layerId()
    const store = fakeStore([ID.hiddenId(layerId)])
    const { visibleSource, hiddenSource } = await visibilityTracker(source, store, new Emitter())
    source.addFeature(feature(ID.featureId(layerId)))
    assert.equal(visibleSource.getFeatures().length, 0)
    assert.equal(hiddenSource.getFeatures().length, 1)
  })

  it('does not hide features of other layers', async function () {
    const source = new VectorSource()
    const hiddenLayer = ID.layerId()
    const otherLayer = ID.layerId()
    const store = fakeStore([ID.hiddenId(hiddenLayer)])
    const { visibleSource } = await visibilityTracker(source, store, new Emitter())
    source.addFeature(feature(ID.featureId(hiddenLayer)))
    source.addFeature(feature(ID.featureId(otherLayer)))
    assert.equal(visibleSource.getFeatures().length, 1)
  })
})
