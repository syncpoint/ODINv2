import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import * as ID from '../../ids'

export const highlightTracker = (emitter, store, sessionStore) => {
  const source = new VectorSource({ features: new Collection() })
  let timeout
  let hiddenIds = []

  const handleTimeout = () => {
    source.clear()
    emitter.emit('feature/hide', { ids: hiddenIds })
  }

  emitter.on('highlight/on', async ({ ids }) => {
    const viewport = await sessionStore.get('viewport')
    const geometries = await store.geometryBounds(ids, viewport.resolution)
    const features = geometries.map(geometry => new Feature(geometry))
    source.addFeatures(features)
    // Temporarily show hidden feature.
    const isHidable = id => ID.isFeatureId(id) || ID.isMarkerId(id) || ID.isMeasureId(id)

    const keys = await store.collectKeys(ids)
    const featureIds = keys.filter(isHidable)
    const tuples = await store.tuples(featureIds.map(ID.hiddenId))

    hiddenIds = tuples
      .filter(([_, value]) => value)
      .map(([key]) => key)

    emitter.emit('feature/show', { ids: hiddenIds })

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(handleTimeout, 5000)
  })

  emitter.on('highlight/off', () => {
    if (!timeout) return
    clearTimeout(timeout)
    handleTimeout()
    timeout = null
  })

  return source
}
