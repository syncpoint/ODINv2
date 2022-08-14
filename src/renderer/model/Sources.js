import * as R from 'ramda'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Event from 'ol/events/Event'
import * as TD from 'throttle-debounce'
import { readFeature, readFeatures, readGeometry } from './geometry'
import * as ID from '../ids'

const isGeometry = value => {
  if (!value) return false
  else if (typeof value !== 'object') return false
  else {
    if (!value.type) return false
    else if (!value.coordinates && !value.geometries) return false
    return true
  }
}


/**
 *
 */
export const featureSource = (store, scope) => {
  const source = new VectorSource()

  const handler = operations => {
    console.log('[featureSource/batch]', JSON.stringify(operations))
    const candidates = operations.filter(({ key }) => ID.isId(scope)(key))
    const additions = candidates.filter(({ type }) => type === 'put')

    const features = additions.map(({ key, value }) => {
      if (!value.type) return console.warn('invalid feature', key, value)

      if (isGeometry(value)) {
        const geometry = readGeometry(value)
        const stored = source.getFeatureById(key)
        if (!stored) return null

        const clone = stored.clone()
        clone.setGeometry(geometry)
        clone.setId(stored.getId())
        return clone
      } else {
        const feature = readFeature({ id: key, ...value })
        const stored = source.getFeatureById(key)
        if (!stored) return feature

        // When only feature properties are updated, geometry is
        // not part of value. Transfer geometry from old to new feature
        // before removing old feature from source.

        const geometry = feature.getGeometry()
        const currentGeometry = stored.getGeometry()
        if (!geometry && currentGeometry) feature.setGeometry(currentGeometry)
        return feature
      }
    })

    // Delete all candidates ...
    candidates
      .map(({ key }) => source.getFeatureById(key))
      .filter(Boolean)
      .forEach(feature => source.removeFeature(feature))

    // ... and add additions.
    source.addFeatures(features.filter(Boolean))
  }

  // Debounce a bit to minimize impact of costly map refresh:
  const debounce_ = R.curry((options, delay, callback) => TD.debounce(delay, callback, options))
  const debounce = debounce_({ atBegin: false })
  const batch = delayed => fn => {
    const acc = []
    // const handler = delayed(() => fn(acc.splice(0)))

    const handler = delayed(function () {
      fn(acc)
      acc.splice(0, acc.length)
    })

    return function (xs) {
      console.log('pushing', xs)
      acc.push(...xs)
      handler()
    }
  }

  const debouncedHandler = batch(debounce(32))(handler)
  store.on('batch', ({ operations }) => debouncedHandler(operations))

  // On startup: load all features:
  window.requestIdleCallback(async () => {
    const tuples = await store.tuples(scope)
    const geoJSON = tuples.map(([id, feature]) => ({ id, ...feature }))
    const [valid, invalid] = R.partition(R.prop('type'), geoJSON)
    if (invalid.length) console.warn('invalid features', invalid)
    const features = readFeatures({ type: 'FeatureCollection', features: valid })
    source.addFeatures(features)
  }, { timeout: 2000 })

  return source
}


/**
 *
 */
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
  const intersection = new VectorSource({ features: new Collection() })

  a.on('addfeature', ({ feature: addition }) => {
    if (!b.getFeatureById(addition.getId())) return
    intersection.addFeature(addition)
  })

  a.on('removefeature', ({ feature: removal }) => {
    const feature = intersection.getFeatureById(removal.getId())
    if (feature) intersection.removeFeature(feature)
  })

  b.on('addfeature', ({ feature: addition }) => {
    if (!a.getFeatureById(addition.getId())) return
    intersection.addFeature(addition)
  })

  b.on('removefeature', ({ feature: removal }) => {
    const feature = intersection.getFeatureById(removal.getId())
    if (feature) intersection.removeFeature(feature)
  })

  return intersection
}

/**
 * union :: ol/source/Vector S => S -> S -> S
 */
export const union = (a, b) => {
  const union = new VectorSource({ features: new Collection() })
  a.on('addfeature', ({ feature }) => union.addFeature(feature))
  a.on('removefeature', ({ feature }) => union.removeFeature(union.getFeatureById(feature.getId())))
  b.on('addfeature', ({ feature }) => union.addFeature(feature))
  b.on('removefeature', ({ feature }) => union.removeFeature(union.getFeatureById(feature.getId())))
  return union
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
export const visibilityTracker = (source, store, emitter) => {
  const keySet = new Set()
  const hidden = key => keySet.has(key)
  const visible = key => !keySet.has(key)

  ;(async () => {
    emitter.on('feature/show', ({ ids }) => {
      const keys = ids.map(ID.associatedId)
      keys.forEach(key => keySet.delete(key))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    emitter.on('feature/hide', ({ ids }) => {
      const keys = ids.map(ID.associatedId)
      keys.forEach(key => keySet.add(key))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    store.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => ID.isHiddenId(key))
        .map(({ type, key }) => ({ type, key: ID.associatedId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => keySet.add(key))
      removals.forEach(({ key }) => keySet.delete(key))

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await store.keys(ID.hiddenId())
    keys.forEach(key => keySet.add(ID.associatedId(key)))
  })()

  return {
    visibleSource: filter(visible)(source),
    hiddenSource: filter(hidden)(source)
  }
}


/**
 *
 */
export const lockedTracker = (source, store) => {
  const keySet = new Set()
  const locked = key => keySet.has(key)
  const unlocked = key => !keySet.has(key)

  ;(async () => {
    store.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => ID.isLockedId(key))
        .map(({ type, key }) => ({ type, key: ID.associatedId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => keySet.add(key))
      removals.forEach(({ key }) => keySet.delete(key))

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await store.keys(ID.lockedId())
    keys.forEach(key => keySet.add(ID.associatedId(key)))
  })()

  return {
    unlockedSource: filter(unlocked)(source),
    lockedSource: filter(locked)(source)
  }
}


export const highlightTracker = (emitter, store, sessionStore) => {
  const source = new VectorSource({ features: new Collection() })
  let timeout
  let hiddenIds = []

  const handleTimeout = () => {
    source.clear()
    emitter.emit('feature/hide', { ids: hiddenIds })
  }

  emitter.on('highlight/on', async ({ ids }) => {
    const viewport = sessionStore.get('viewport')
    const geometries = await store.geometryBounds(ids, viewport.resolution)
    const features = geometries.map(geometry => new Feature(geometry))
    source.addFeatures(features)

    // Temporarily show hidden feature.
    const isHidable = id => ID.isFeatureId(id) || ID.isMarkerId(id)

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
