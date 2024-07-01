import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Event from 'ol/events/Event'
import GeoJSON from 'ol/format/GeoJSON'
import * as ID from '../ids'

const format = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})


export const experimentalSource = services => {
  const { store, emitter } = services
  const state = { loaded: false }

  const readFeature = source => {
    console.log(state)
    const feature = format.readFeature(source)

    feature.$ = {
      feature: Signal.of(feature),
      globalStyle: Signal.of(state.globalStyle),
      layerStyle: Signal.of({}),
      featureStyle: Signal.of({}),
      centerResolution: Signal.of(state.resolution)
    }

    return feature
  }

  const reduce = async (prefix, fn, acc) => {
    const db = store.db
    const it = db.iterator({ gte: `${prefix}`, lte: `${prefix}\xff` })
    for await (const entry of it) acc = fn(acc, entry)
    return acc
  }

  const push = (acc, [key, value]) => {
    acc.push(readFeature(({ id: key, ...value })))
    return acc
  }

  const index = new VectorSource({
    useSpatialIndex: true,
    features: [],
    loader: async (extent, resolution, projection, success, failure) => {
      console.log('[index] loading...')
    }
  })

  const loader = async (extent, resolution, projection, success) => {
    const now = Date.now()

    state.extent = extent
    state.resolution = resolution
    state.projection = projection

    if (!state.loaded) {
      // pre-load and store global style
      state.globalStyle = await store.value(ID.defaultStyleId)
      const features = await reduce(ID.FEATURE_SCOPE, push, [])
      index.addFeatures(features)
      state.loaded = true
      console.log('loaded features', features.length)
    }

    const features = index.getFeaturesInExtent(extent)
    source.clear()
    if (success) success(features)
    else source.addFeatures(features)
    console.log('features in view', features.length, 'time', (Date.now() - now), 'ms')
  }

  const strategy = (extent, resolution) => {
    const bbox = extent.join(',')
    if (!state.projection) return [extent]

    if (bbox !== state.bbox) {
      state.bbox = bbox
      loader(extent, resolution, state.projection)
      source.clear()
    }

    return [extent]
  }

  const source = new VectorSource({ useSpatialIndex: false, loader, strategy })
  return source
}

/**
 *
 */
export const featureSource = (featureStore, scope) => {
  const matchesScope = feature => feature
    ? ID.isId(scope)(feature.getId())
    : false

  const source = new VectorSource({ features: [] })

  console.log('[featureSource] registering listeners...')

  featureStore.on('addfeatures', ({ features }) => {
    source.addFeatures(features.filter(matchesScope))
  })

  featureStore.on('removefeatures', ({ features }) => features
    .filter(matchesScope)
    .forEach(feature => source.removeFeature(feature))
  )

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
 * union :: ol/source/Vector S => [S] -> S
 */
export const union = (...sources) => {
  const union = new VectorSource({ features: new Collection() })

  sources.forEach(source => {
    union.addFeatures(source.getFeatures())
    source.on('addfeature', ({ feature }) => union.addFeature(feature))
    source.on('removefeature', ({ feature }) => union.removeFeature(union.getFeatureById(feature.getId())))
  })

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
export const visibilityTracker = async (source, store, emitter) => {
  const keySet = new Set()
  const hidden = key => keySet.has(key)
  const visible = key => !keySet.has(key)

  await (async () => {
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
