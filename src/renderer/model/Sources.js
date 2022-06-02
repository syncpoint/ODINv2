import * as R from 'ramda'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Event from 'ol/events/Event'
import { readFeature, readFeatures, readGeometry, transform, geometryType } from './geometry'
import { scope, isFeatureId, isLockedFeatureId, isHiddenFeatureId, lockedId, hiddenId, featureId } from '../ids'
import * as TS from '../ol/ts'

export const featureSource = store => {
  const source = new VectorSource()

  store.on('batch', ({ operations }) => {
    const candidates = operations.filter(({ key }) => key.startsWith('feature:'))
    const additions = candidates.filter(({ type }) => type === 'put')

    // Source.addFeature() does not support re-adding,
    // hence delete all candidates...
    candidates.forEach(({ key }) => {
      const feature = source.getFeatureById(key)
      if (feature) source.removeFeature(feature)
    })

    // ... and add additions/updates.
    const features = additions.map(({ value }) => readFeature(value))
    source.addFeatures(features)
  })

  // On startup: load all features:
  window.requestIdleCallback(async () => {
    const json = await store.selectFeatures()
    const features = readFeatures({ type: 'FeatureCollection', features: json })
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
  const keySet = {}

  const selected = key => keySet[key]
  const deselected = key => !keySet[key]

  selection.on('selection', ({ selected, deselected }) => {
    selected.forEach(key => (keySet[key] = true))
    deselected.forEach(key => delete keySet[key])
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
  const keySet = {}
  const hidden = key => keySet[key]
  const visible = key => !keySet[key]

  ;(async () => {
    emitter.on('feature/show', ({ ids }) => {
      const keys = ids.map(featureId)
      keys.forEach(key => delete keySet[key])
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    emitter.on('feature/hide', ({ ids }) => {
      const keys = ids.map(featureId)
      keys.forEach(key => (keySet[key] = true))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    store.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => isHiddenFeatureId(key))
        .map(({ type, key }) => ({ type, key: featureId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => (keySet[key] = true))
      removals.forEach(({ key }) => delete keySet[key])

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await store.keys(hiddenId('feature:'))
    keys.forEach(key => (keySet[featureId(key)] = true))
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
  const keySet = {}
  const locked = key => keySet[key]
  const unlocked = key => !keySet[key]

  ;(async () => {
    store.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => isLockedFeatureId(key))
        .map(({ type, key }) => ({ type, key: featureId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => (keySet[key] = true))
      removals.forEach(({ key }) => delete keySet[key])

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await store.keys(lockedId('feature:'))
    keys.forEach(key => (keySet[featureId(key)] = true))
  })()

  return {
    unlockedSource: filter(unlocked)(source),
    lockedSource: filter(locked)(source)
  }
}

const BOUNDS = {}

BOUNDS.layer = store => (acc, ids) => {
  const read = R.compose(TS.read, readGeometry)
  const write = TS.write

  return ids.reduce(async (acc, id) => {
    const bounds = await acc
    const geometries = await store.selectGeometries(id)
    if (!geometries.length) return bounds

    const collection = TS.collect(geometries.map(read))
    bounds.push(write(TS.minimumRectangle(collection)))
    return bounds
  }, acc)
}

BOUNDS.feature = (store, viewMemento) => async (acc, ids) => {
  const resolution = viewMemento.resolution()

  const featureBounds = {
    Polygon: R.identity,
    LineString: geometry => TS.lineBuffer(geometry)(resolution * 10),
    'LineString:Point': geometry => {
      const [lineString, point] = TS.geometries(geometry)
      const segment = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate))
      const width = segment.getLength()
      return TS.lineBuffer(lineString)(width)
    },
    MultiPoint: geometry => {
      const [center, ...coords] = TS.coordinates(geometry)
      const ranges = coords.map(coord => TS.segment(center, coord).getLength())
      const range = Math.max(...ranges)
      return TS.pointBuffer(TS.point(center))(range)
    }
  }

  const geometries = await store.selectGeometries(ids)
  return geometries
    .map(readGeometry)
    .reduce((acc, geometry) => {
      const type = geometryType(geometry)
      const { read, write } = transform(geometry)
      const bounds = featureBounds[type] || (geometry => TS.minimumRectangle(geometry))
      acc.push(write(bounds(read(geometry))))
      return acc
    }, acc)
}


export const highlightTracker = (emitter, selection, store, viewMemento) => {
  const source = new VectorSource({ features: new Collection() })
  const ids = id => R.uniq([id, ...selection.selected()])
  let timeout
  let hiddenIds = []

  const handleTimeout = () => {
    source.clear()
    emitter.emit('feature/hide', { ids: hiddenIds })
  }

  emitter.on('highlight/on', async ({ id }) => {
    const scopes = R.groupBy(id => scope(id), ids(id))
    const geometries = await Object.entries(scopes).reduce(async (acc, scope) => {
      const bounds = await acc
      if (!BOUNDS[scope[0]]) return bounds
      else return BOUNDS[scope[0]](store, viewMemento)(bounds, scope[1])
    }, [])

    const features = geometries.map(geometry => new Feature(geometry))
    source.addFeatures(features)

    // Temporarily show hidden feature.

    const featureIds = (await store.collectKeys_(ids(id), ['link']))
      .filter(isFeatureId)
      .map(id => `hidden+${id}`)

    hiddenIds = Object.entries(await store.entries(featureIds))
      .filter(([key, value]) => value)
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
