import util from 'util'
import uuid from 'uuid-random'
import Emitter from '../../../shared/emitter'
import { Translate } from 'ol/interaction'
import { cmdOrCtrl } from '../../platform'
import * as ids from '../../ids'
import { writeGeometryObject } from '../../store/format'

/**
 * Track whether CMD/CTRL is currently pressed.
 * Use in translate interaction for cloning features.
 */
const CmdOrCtrlTracker = function () {
  Emitter.call(this)
  this.handler_ = event => {
    const current = this.cmdOrCtrl && event.shiftKey
    const value = cmdOrCtrl(event)
    if (current !== value) this.emit('update', { cmdOrCtrl: value })
    this.cmdOrCtrl = value
  }

  document.addEventListener('keydown', this.handler_)
  document.addEventListener('keyup', this.handler_)
}

util.inherits(CmdOrCtrlTracker, Emitter)

/* Note: Currently not used. */
CmdOrCtrlTracker.prototype.dispose = function () {
  document.removeEventListener('keydown', this.handler_)
  document.removeEventListener('keyup', this.handler_)
}

const cmdOrCtrlTracker = new CmdOrCtrlTracker()


/**
 *
 */
export default (options, select) => {
  const { store, featureSource, hitTolerance, selection } = options

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures()
  })

  const CLONES = 'clones'
  const CLONING = 'cloning'
  const CANCELLED = 'cancelled'
  const UPDATE_CURSOR = 'updateCursor'
  const FEATURES = 'features'

  const silent = true
  const set = (key, value) => {
    interaction.set(key, value, silent)
    return value
  }

  const unset = key => {
    const value = interaction.get(key)
    interaction.unset(key, silent)
    return value
  }

  interaction.on('translatestart', event => {
    set(CANCELLED, false)

    const updateCursor = set(UPDATE_CURSOR, cursor => {
      const map = interaction.getMap()
      const target = map.getViewport()
      target.style.cursor = cursor
    })

    // Clone features with new identities.
    // New identities are only necessary for clone interaction.
    // Simple translate ignores feature identities and
    // only takes geometries by position in array.

    const features = set(FEATURES, [...event.features.getArray()])
    const clones = set(CLONES, features.map(feature => {
      const layerUUID = ids.layerUUID(feature.getId())
      const clone = feature.clone()
      const id = `feature:${layerUUID}/${uuid()}`
      clone.setId(id)
      return clone
    }))

    const cloning = set(CLONING, cmdOrCtrlTracker.cmdOrCtrl)
    if (cloning) {
      updateCursor('copy')

      // Add clones to source as placeholders.
      // Placeholders must be removed before adding to store,
      // because re-adding them to the source will result in a major
      // (feature) identity crisis.
      featureSource.addFeatures(clones)
    }
  })

  interaction.on('translateend', async event => {
    const cloning = unset(CLONING)
    const clones = unset(CLONES)
    const cancelled = unset(CANCELLED)
    const updateCursor = unset(UPDATE_CURSOR)
    unset(FEATURES)

    if (cancelled) return

    updateCursor(null)
    const features = event.features.getArray()


    if (cloning) {

      // Get complete properties set for all features:
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
    } else {

      // geometries :: { id -> [new, old] }
      const geometries = features.reduce((acc, feature, index) => {
        acc[feature.getId()] = [
          writeGeometryObject(feature.getGeometry()), // new geometry
          writeGeometryObject(clones[index].getGeometry()) // old geometry
        ]
        return acc
      }, {})

      store.updateGeometries(geometries)
    }
  })

  // Cancel on deselect:
  selection.on('selection', () => {
    if (!interaction.get(CLONING)) return

    set(CANCELLED, true)
    interaction.get(UPDATE_CURSOR)(null)
    const clones = interaction.get(CLONES)
    const features = interaction.get(FEATURES)

    clones.forEach((clone, index) => {
      features[index].setGeometry(clone.getGeometry().clone())
      featureSource.removeFeature(clone)
    })
  })

  return interaction
}
