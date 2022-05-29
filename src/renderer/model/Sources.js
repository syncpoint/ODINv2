import * as R from 'ramda'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import Event from 'ol/events/Event'
import { readFeature, readFeatures } from './geometry'

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

export const filtered = predicate => source => {

  // Supply empty collection which will be kept in sync with source.
  // This is neccessary for interactions which only accept feature collections
  // instead of sources (e.g. translate, clone).
  const destination = new VectorSource({ features: new Collection() })

  source.on('addfeature', ({ feature: addition }) => {
    if (predicate(addition.getId())) destination.addFeature(addition)
  })

  source.on('removefeature', ({ feature: removal }) => {
    const feature = destination.getFeatureById(removal.getId())
    if (feature) destination.removeFeature(feature)
  })

  source.on('touchfeatures', ({ keys }) => {
    keys.forEach(key => {
      if (predicate(key)) {
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

export const selectionTracker = (source, selection) => {
  const keySet = {}
  const selected = key => keySet[key]
  const deselected = key => !keySet[key]

  selection.on('selection', ({ selected, deselected }) => {
    selected.forEach(key => (keySet[key] = true))
    deselected.forEach(key => delete keySet[key])
    source.dispatchEvent(new TouchFeaturesEvent([...selected, ...deselected]))
  })

  return {
    selectedSource: filtered(selected)(source),
    deselectedSource: filtered(deselected)(source)
  }
}

export const visibilityTracker = (source, store) => {
  const keySet = {}
  const hidden = key => keySet[key]
  const visible = key => !keySet[key]

  ;(async () => {
    store.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => key.startsWith('hidden+feature:'))
        .map(({ type, key }) => ({ type, key: key.substring(7) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => (keySet[key] = true))
      removals.forEach(({ key }) => delete keySet[key])

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await store.keys('hidden+feature:')
    keys.forEach(key => (keySet[key.substring(7)] = true))
  })()

  return {
    visibleSource: filtered(visible)(source),
    hiddenSource: filtered(hidden)(source)
  }
}
