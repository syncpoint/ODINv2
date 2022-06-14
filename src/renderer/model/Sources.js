import * as R from 'ramda'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Event from 'ol/events/Event'
import { readFeature, readFeatures } from './geometry'
import { isFeatureId, isLockedFeatureId, isHiddenFeatureId, lockedId, hiddenId, featureId } from '../ids'

export const featureSource = featureStore => {
  const source = new VectorSource()

  featureStore.on('batch', ({ operations }) => {
    const candidates = operations.filter(({ key }) => key.startsWith('feature:'))
    const additions = candidates.filter(({ type }) => type === 'put')

    // Source.addFeature() does not support re-adding,
    // hence delete all candidates...
    candidates.forEach(({ key }) => {
      const feature = source.getFeatureById(key)
      if (feature) source.removeFeature(feature)
    })

    // ... and add additions/updates.
    const features = additions.map(({ key, value }) => readFeature({ id: key, ...value }))
    source.addFeatures(features)
  })

  // On startup: load all features:
  window.requestIdleCallback(async () => {
    const tuples = await featureStore.tuples('feature:')
    const geoJSON = tuples.map(([id, feature]) => ({ id, ...feature }))
    const features = readFeatures({ type: 'FeatureCollection', features: geoJSON })
    source.addFeatures(features)
  }, { timeout: 2000 })

  return source
}

export class TouchFeaturesEvent extends Event {
  constructor (keys) {
    super('touchfeatures')
    this.keys = keys
  }
}


/**
 *
 */
export const filter = predicate => source => {

  // Supply empty collection which will be kept in sync with source.
  // This is neccessary for interactions which only accept feature collections
  // instead of sources (e.g. translate, clone).
  const destination = new VectorSource({ features: new Collection() })

  source.on('addfeature', ({ feature: addition }) => {
    if (destination.getFeatureById(addition.getId())) return
    if (!predicate(addition.getId())) return
    destination.addFeature(addition)
  })

  source.on('removefeature', ({ feature: removal }) => {
    const feature = destination.getFeatureById(removal.getId())
    if (feature) destination.removeFeature(feature)
  })

  source.on('touchfeatures', ({ keys }) => {
    keys.forEach(key => {
      if (predicate(key)) {
        // Note: Re-adding would actually remove the feature!
        if (destination.getFeatureById(key)) return
        const feature = source.getFeatureById(key)
        if (feature) destination.addFeature(feature)
      } else {
        const feature = destination.getFeatureById(key)
        if (feature) destination.removeFeature(feature)
      }
    })
  })

  const additions = source.getFeatures().filter(feature => predicate(feature.getId()))
  destination.addFeatures(additions)

  return destination
}

/**
 * intersect :: ol/source/Vector S => S -> S -> S
 */
export const intersect = (a, b) => {
  const destination = new VectorSource({ features: new Collection() })

  a.on('addfeature', ({ feature: addition }) => {
    if (!b.getFeatureById(addition.getId())) return
    destination.addFeature(addition)
  })

  a.on('removefeature', ({ feature: removal }) => {
    const feature = destination.getFeatureById(removal.getId())
    if (feature) destination.removeFeature(feature)
  })

  b.on('addfeature', ({ feature: addition }) => {
    if (!a.getFeatureById(addition.getId())) return
    destination.addFeature(addition)
  })

  b.on('removefeature', ({ feature: removal }) => {
    const feature = destination.getFeatureById(removal.getId())
    if (feature) destination.removeFeature(feature)
  })

  return destination
}

/**
 *
 */
export const selectionTracker = (source, selection) => {
  const keySet = new Set()

  const selected = key => keySet.has(key)
  const deselected = key => !keySet.has(key)

  selection.on('selection', ({ selected, deselected }) => {
    selected.forEach(key => keySet.add(key))
    deselected.forEach(key => keySet.delete(key))
    const keys = [...selected, ...deselected]
    source.dispatchEvent(new TouchFeaturesEvent(keys))
  })

  return {
    selectedSource: filter(selected)(source),
    deselectedSource: filter(deselected)(source)
  }
}


/**
 *
 */
export const visibilityTracker = (source, featureStore, emitter) => {
  const keySet = new Set()
  const hidden = key => keySet.has(key)
  const visible = key => !keySet.has(key)

  ;(async () => {
    emitter.on('feature/show', ({ ids }) => {
      const keys = ids.map(featureId)
      keys.forEach(key => keySet.delete(key))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    emitter.on('feature/hide', ({ ids }) => {
      const keys = ids.map(featureId)
      keys.forEach(key => keySet.add(key))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    featureStore.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => isHiddenFeatureId(key))
        .map(({ type, key }) => ({ type, key: featureId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => keySet.add(key))
      removals.forEach(({ key }) => keySet.delete(key))

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await featureStore.keys(hiddenId('feature:'))
    keys.forEach(key => keySet.add(featureId(key)))
  })()

  return {
    visibleSource: filter(visible)(source),
    hiddenSource: filter(hidden)(source)
  }
}


/**
 *
 */
export const lockedTracker = (source, featureStore) => {
  const keySet = new Set()
  const locked = key => keySet.has(key)
  const unlocked = key => !keySet.has(key)

  ;(async () => {
    featureStore.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => isLockedFeatureId(key))
        .map(({ type, key }) => ({ type, key: featureId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => keySet.add(key))
      removals.forEach(({ key }) => keySet.delete(key))

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await featureStore.keys(lockedId('feature:'))
    keys.forEach(key => keySet.add(featureId(key)))
  })()

  return {
    unlockedSource: filter(unlocked)(source),
    lockedSource: filter(locked)(source)
  }
}


export const highlightTracker = (emitter, featureStore, viewMemento) => {
  const source = new VectorSource({ features: new Collection() })
  let timeout
  let hiddenIds = []

  const handleTimeout = () => {
    source.clear()
    emitter.emit('feature/hide', { ids: hiddenIds })
  }

  emitter.on('highlight/on', async ({ ids }) => {
    const geometries = await featureStore.geometryBounds(ids, viewMemento.resolution())
    const features = geometries.map(geometry => new Feature(geometry))
    source.addFeatures(features)

    // Temporarily show hidden feature.

    const keys = await featureStore.collectKeys(ids)
    const featureIds = keys.filter(isFeatureId)
    const tuples = await featureStore.tuples(featureIds.map(id => `hidden+${id}`))

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
