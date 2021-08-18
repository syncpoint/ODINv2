import { click, primaryAction, platformModifierKeyOnly } from 'ol/events/condition'
import { defaults as defaultInteractions, Translate, Select, Snap } from 'ol/interaction'
import { featureStyle } from '../style'
import Modify from './Modify'

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const noShiftKey = ({ originalEvent }) => originalEvent.shiftKey !== true
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)


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
  let oldGeometries = {} // Cloned geometries BEFORE modify.

  const interaction = new Translate({
    hitTolerance,
    features: select.getFeatures()
  })

  interaction.on('translatestart', ({ features }) => {
    oldGeometries = features.getArray().reduce((acc, feature) => {
      acc[feature.getId()] = feature.getGeometry().clone()
      return acc
    }, {})
  })

  interaction.on('translateend', ({ features }) => {
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
  const translate = translateInteraction(layerStore, undo, select)
  const modify = modifyInteraction(layerStore, undo, partition)
  const snap = snapInteraction(features)
  return defaultInteractions({ doubleClickZoom: false }).extend(
    [select, translate, modify, snap]
  )
}
