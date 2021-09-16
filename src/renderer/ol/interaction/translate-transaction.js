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
  let clones = []

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures()
  })

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

  interaction.on('translatestart', ({ features }) => {
    const updateCursor = set('updateCursor', cursor => {
      const map = interaction.getMap()
      const target = map.getViewport()
      target.style.cursor = cursor
    })

    // Clone features with new identities:
    clones = features.getArray().map(feature => {
      const layerUUID = ids.layerUUID(feature.getId())
      const clone = feature.clone()
      const id = `feature:${layerUUID}/${uuid()}`
      clone.setId(id)
      return clone
    })

    const cloning = set('cloning', cmdOrCtrlTracker.cmdOrCtrl)
    if (cloning) {
      updateCursor('copy')

      // Add clones to source as placeholders.
      // Placeholders must be removed before adding to store,
      // because re-adding them to the source will result in a major
      // (feature) identity crisis.
      featureSource.addFeatures(clones)
    }
  })

  interaction.on('translateend', async ({ features }) => {
    const cloning = unset('cloning')
    const updateCursor = unset('updateCursor')
    updateCursor(null)

    if (cloning) {

      // Get complete properties set for all features:
      const ids = features.getArray().map(feature => feature.getId())
      const properties = await store.select(ids)

      // Swap geometries: feature <-> clone.
      features.getArray().forEach((feature, index) => {
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
      const geometries = features.getArray().reduce((acc, feature, index) => {
        acc[feature.getId()] = [
          feature.getGeometry(), // new geometry
          clones[index].getGeometry() // old geometry
        ]
        return acc
      }, {})

      store.updateGeometries(geometries)
    }
  })

  return interaction
}
