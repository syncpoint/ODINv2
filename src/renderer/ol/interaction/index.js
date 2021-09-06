import util from 'util'
import uuid from 'uuid-random'
import Emitter from '../../../shared/emitter'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import { defaults as defaultInteractions, Translate, Select, Snap } from 'ol/interaction'
import { featureStyle } from '../style'
import Modify from './Modify'
import { cmdOrCtrl } from '../../platform'
import * as ids from '../../ids'
import { writeGeometryObject } from '../../store/format'

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

/**
 * Track whether CMD/CTRL is currently pressed.
 * Use in translate interaction for cloning features.
 */
const CmdOrCtrlTracker = function () {
  Emitter.call(this)
  this.handler_ = event => {
    const current = this.cmdOrCtrl
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
 * @param {*} selection
 * @param {*} partition
 * @param {*} featureLayer
 * @param {*} selectedLayer
 * @returns
 */
const selectInteraction = (
  selection,
  partition,
  featureLayer,
  selectedLayer
) => {
  const interaction = new Select({
    hitTolerance,
    layers: [featureLayer, selectedLayer],
    style: featureStyle(selection),
    condition: conjunction(click, noAltKey),
    toggleCondition: platformModifierKeyOnly, // macOS: command
    multi: false // don't select all features under cursor at once.
  })

  interaction.on('select', () => {
    // Propagate to global selection.
    // NOTE: selected, deselected are deltas/changes.
    const ids = features => features.map(feature => feature.getId())
    selection.set(ids(interaction.getFeatures().getArray()))
  })

  partition.getSelected().on('addfeature', ({ feature }) => {
    const features = interaction.getFeatures().getArray()
    if (!features.includes(feature)) interaction.getFeatures().push(feature)
  })

  partition.getSelected().on('removefeature', ({ feature }) => {
    const features = interaction.getFeatures().getArray()
    if (features.includes(feature)) interaction.getFeatures().remove(feature)
  })

  return interaction
}


/**
 * @param {LayerStore} layerStore
 * @param {Undo} undo
 * @param {ol/insteraction/Select} select
 * @param {ol/VectorSource} featureSource source for all features
 * @param {Selection} selection
 * @returns {ol/interaction/Translate}
 */
const translateInteraction = (
  layerStore,
  undo,
  select,
  featureSource,
  selection
) => {
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
      featureSource.addFeatures(clones)
    }
  })

  interaction.on('translateend', async ({ features }) => {
    const cloning = unset('cloning')
    const updateCursor = unset('updateCursor')
    updateCursor(null)

    if (cloning) {

      // Get complete properties set for all features:
      const featureIds = features.getArray().map(feature => feature.getId())
      const properties = await layerStore.getFeatureProperties(featureIds)

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

      const command = layerStore.commands.putFeatures(json)
      undo.apply(command)

      // Finally, set clones as new selection:
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

      const command = layerStore.commands.updateGeometries(geometries)
      undo.apply(command)
    }
  })

  return interaction
}


/**
 * @param {*} layerStore
 * @param {*} undo
 * @param {*} partition
 * @returns
 */
const modifyInteraction = (
  layerStore,
  undo,
  partition
) => {
  let clones = [] // Cloned geometries BEFORE modify.

  const interaction = new Modify({
    source: partition.getSelected(),
    // Allow translate while editing (with shift key pressed):
    condition: conjunction(primaryAction, noShiftKey),
    snapToPointer: false, // FIXME: does this really prevent snapping?
    hitTolerance
  })

  interaction.on('modifystart', ({ features }) => {
    clones = features.getArray().map(feature => feature.getGeometry().clone())
  })

  interaction.on('modifyend', ({ features }) => {
    const geometries = features.getArray().reduce((acc, feature, index) => {
      acc[feature.getId()] = [
        feature.getGeometry(),
        clones[index]
      ]
      return acc
    }, {})

    const command = layerStore.commands.updateGeometries(geometries)
    undo.apply(command)
  })

  return interaction
}


/**
 *
 */
const snapInteraction = (
  featureSource
) => {
  return new Snap({
    source: featureSource
  })
}

/**
 * @param {Selection} selection
 * @param {LayerStore} layerStore
 * @param {Undo} undo
 * @param {Partition} partition
 * @param {ol/VectorLayer} featureLayer
 * @param {ol/VectorLayer} selectedLayer
 * @param {ol/VectorSource} featureSource source for all features
 */
export default (
  selection,
  layerStore,
  undo,
  partition,
  featureLayer,
  selectedLayer,
  featureSource
) => {
  const select = selectInteraction(selection, partition, featureLayer, selectedLayer)
  const modify = modifyInteraction(layerStore, undo, partition)
  const translate = translateInteraction(layerStore, undo, select, featureSource, selection)
  const snap = snapInteraction(featureSource)
  return defaultInteractions({ doubleClickZoom: false }).extend(
    [select, translate, modify, snap]
  )
}
