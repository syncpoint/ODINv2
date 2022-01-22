import uuid from 'uuid-random'
import { Translate } from 'ol/interaction'
import { MAC } from 'ol/has'
import { writeGeometryObject } from '../../model/geometry'
import * as ids from '../../ids'


/**
 *
 */
export default (options, select) => {
  const { store, featureSource, hitTolerance, selection } = options

  // Has cloning operation started?
  let cloning = false

  let cancelled = false

  // snapshot :: [ol/Feature]
  // Current feature list is necessary for cancel.
  let snapshot = []

  // clones :: [ol/Feature]
  let clones = []

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures(),

    // Both platform modifier key and shift key must be pressed,
    // but no other modifier key (alt).
    condition: event => {
      const originalEvent = event.originalEvent
      return (
        !originalEvent.altKey &&
        (MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
        originalEvent.shiftKey
      )
    }
  })

  interaction.on('translatestart', event => {
    cloning = true
    cancelled = false
    const map = interaction.getMap()
    const target = map.getViewport()
    target.style.cursor = 'copy'

    snapshot = [...event.features.getArray()]

    // Clone features with new identities.

    clones = snapshot.map(feature => {
      const layerUUID = ids.layerUUID(feature.getId())
      const clone = feature.clone()
      const id = `feature:${layerUUID}/${uuid()}`
      clone.setId(id)
      return clone
    })

    // Add clones to source as placeholders.
    // Placeholders must be removed before adding to store,
    // because re-adding them to the source will result in a major
    // (feature) identity crisis.
    featureSource.addFeatures(clones)
  })

  interaction.on('translateend', async event => {
    cloning = false
    const map = interaction.getMap()
    const target = map.getViewport()
    target.style.cursor = null

    if (cancelled) return

    // Get complete properties set for all features.
    // Note: ol/Feature does not carry all persisted data.
    const features = event.features.getArray()
    const ids = features.map(feature => feature.getId())
    const properties = await store.select(ids)

    // Swap geometries: feature <-> clone.
    features.forEach((feature, index) => {
      const geometry = feature.getGeometry()
      feature.setGeometry(clones[index].getGeometry())
      clones[index].setGeometry(geometry)
    })

    // Prepare new JSON features to put into store:
    const json = clones.map((clone, index) => {
      const geometry = writeGeometryObject(clone.getGeometry())
      return { ...properties[index], id: clone.getId(), geometry }
    })

    // Important: Remove clones from source before adding to store.
    clones.forEach(clone => featureSource.removeFeature(clone))
    await store.insertFeatures(json)
    selection.set(clones.map(clone => clone.getId()))
  })

  // Cancel operation on selection change:
  selection.on('selection', () => {
    if (!cloning) return

    cancelled = true

    clones.forEach((clone, index) => {
      snapshot[index].setGeometry(clone.getGeometry().clone())
      featureSource.removeFeature(clone)
    })
  })

  return interaction
}
