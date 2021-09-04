import util from 'util'
import uuid from 'uuid-random'
import Emitter from '../../../shared/emitter'
import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import { defaults as defaultInteractions, Translate, Select, Snap } from 'ol/interaction'
import { featureStyle } from '../style'
import Modify from './Modify'
import { cmdOrCtrl } from '../../platform'
import * as ids from '../../ids'

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
    console.log('[Select]', interaction.getFeatures().getArray())
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
 * @param {*} layerStore
 * @param {*} undo
 * @param {*} select
 * @returns
 */
const translateInteraction = (
  layerStore,
  undo,
  select
) => {
  let state = {}

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

    // Complete clones of original features.
    // Note: Features lose their id after cloning.
    state = features.getArray().reduce((acc, feature) => {
      acc[feature.getId()] = { original: feature.clone() }
      return acc
    }, {})

    const updateCursor = set('updateCursor', cursor => {
      const map = interaction.getMap()
      const target = map.getViewport()
      target.style.cursor = cursor
    })

    const cloning = set('cloning', cmdOrCtrlTracker.cmdOrCtrl)
    if (cloning) {
      // Insert original features under new identities but
      // with same geometry to the map.
      // Later we switch geometries between original featues
      // and clones to correct identities.
      Object.entries(state).forEach(([id, slot]) => {
        // Assign new (imposter) ids to clones:
        const layerUUID = ids.layerUUID(id)
        state[id].imposter = `feature:${layerUUID}/${uuid()}`
        slot.original.setId(state[id].imposter)
      })

      const imposters = Object.values(state).map(slot => slot.original)
      layerStore.putFeatures(imposters)

      updateCursor('copy')
    }

    const cmdOrCtrlHandler = set('cmdOrCtrlHandler', ({ cmdOrCtrl }) => {
      const setCloning = flag => {
        updateCursor(flag ? 'copy' : 'auto')
        interaction.set('cloning', flag, true)
      }

      setCloning(cmdOrCtrl)
    })

    cmdOrCtrlTracker.on('update', cmdOrCtrlHandler)
  })

  interaction.on('translateend', ({ features }) => {
    // const updateCursor = unset('updateCursor')
    // updateCursor(null)
    // const cloning = unset('cloning')
    // const cmdOrCtrlHandler = unset('cmdOrCtrlHandler')
    // cmdOrCtrlTracker.off('update', cmdOrCtrlHandler)

    // const newGeometries = () => features.getArray().reduce((acc, feature) => {
    //   acc[feature.getId()] = feature.getGeometry()
    //   return acc
    // }, {})

    // const command = cloning
    //   ? layerStore.commands.cloneFeatures(features.getArray())
    //   : layerStore.commands.updateGeometries(originalFeatures, newGeometries())

    // undo.apply(command)
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
  let oldGeometries = {} // Cloned geometries BEFORE modify.

  const interaction = new Modify({
    source: partition.getSelected(),
    // Allow translate while editing (with shift key pressed):
    condition: conjunction(primaryAction, noShiftKey),
    snapToPointer: false, // FIXME: does this really prevent snapping?
    hitTolerance
  })

  interaction.on('modifystart', ({ features }) => {
    oldGeometries = features.getArray().reduce((acc, feature) => {
      acc[feature.getId()] = feature.getGeometry().clone()
      return acc
    }, {})
  })

  interaction.on('modifyend', ({ features }) => {
    const newGeometries = features.getArray().reduce((acc, feature) => {
      acc[feature.getId()] = feature.getGeometry()
      return acc
    }, {})

    const command = layerStore.commands.updateGeometries(oldGeometries, newGeometries)
    undo.apply(command)
  })

  return interaction
}


/**
 *
 */
const snapInteraction = (
  features
) => {
  return new Snap({
    source: features
  })
}

export default (
  selection,
  layerStore,
  undo,
  partition,
  featureLayer,
  selectedLayer,
  features
) => {
  const select = selectInteraction(selection, partition, featureLayer, selectedLayer)
  const modify = modifyInteraction(layerStore, undo, partition)
  const translate = translateInteraction(layerStore, undo, select)
  const snap = snapInteraction(features)
  return defaultInteractions({ doubleClickZoom: false }).extend(
    [select, translate, modify, snap]
  )
}
