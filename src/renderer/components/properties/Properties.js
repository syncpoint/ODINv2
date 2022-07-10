/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import { useServices } from '../hooks'
import * as MILSTD from '../../symbology/2525c'
import { isFeatureId, lockedId, associatedId, scope, isAssociatedId } from '../../ids'
import GridCols2 from './GridCols2'
import MarginTop3 from './MarginTop3'
import UnitProperties from './UnitProperties'
import EquipmentProperties from './EquipmentProperties'
import InstallationProperties from './InstallationProperties'
import ActivityProperties from './ActivityProperties'
import GraphicsProperties from './GraphicsProperties'
import PointProperties from './PointProperties'
import LayerProperties from './LayerProperties'
import './Properties.css'

const propertiesPanels = {
  'feature:UNIT': props => <UnitProperties {...props}/>,
  'feature:EQUIPMENT': props => <EquipmentProperties {...props}/>,
  'feature:INSTALLATION': props => <InstallationProperties {...props}/>,
  'feature:ACTIVITY': props => <ActivityProperties {...props}/>,
  'feature:GRAPHICS': props => <GraphicsProperties {...props}/>,
  'feature:POINT': props => <PointProperties {...props}/>,
  layer: props => <LayerProperties {...props}/>
}

const sidc = feature =>
  feature &&
  feature.properties &&
  feature.properties.sidc

/**
 *
 */
const propertiesClasses = features => Object
  .entries(features)
  .reduce((acc, [key, value]) => {
    const push = name => name && R.tap(acc => acc.push(name), acc)
    const className = isFeatureId(key)
      ? `feature:${MILSTD.className(sidc(value)) || ''}`
      : scope(key)

    return push(className)
  }, [])


/**
 *
 */
const propertiesClass = features => {
  const classes = R.uniq(propertiesClasses(features))
  return classes.length === 1 ? R.head(classes) : null
}

/**
 *
 */
const locked = locks => Object
  .values(locks)
  .map(locked => locked || false)
  .reduce((acc, locked) => acc || locked, false)


/**
 *
 */
const resetState = (_, { features, locks }) => ({
  features,
  locks,
  propertiesClass: propertiesClass(features),
  disabled: locked(locks)
})


/**
 *
 */
const updateFeatures = (operations, features) => operations
  .filter(({ key }) => !isAssociatedId(key))
  .reduce((acc, { type, key, value }) => {
    if (type === 'del') delete acc[key]
    else acc[key] = value
    return acc
  }, features)


/**
 *
 */
const updateLocks = (operations, features, locks) => operations
  .filter(({ key }) => isAssociatedId(key))
  .map(({ type, key, value }) => ({ type, key: associatedId(key), value }))
  .filter(({ key }) => features[key]) // Don't bother if associated entry is unknown.
  .reduce((acc, { type, key, value }) => {
    if (type === 'del') delete acc[key]
    else acc[key] = value
    return acc
  }, locks)


/**
 *
 */
const updateState = (state, { operations }) => {
  const features = updateFeatures(operations, state.features)
  const locks = updateLocks(operations, features, state.locks)

  return {
    features,
    locks,
    propertiesClass: propertiesClass(features),
    disabled: locked(locks)
  }
}


/**
 * Reduce selection and store events to appropriate model:
 * { features, lock, propertiesClass, disabled }
 */
const reducer = (state, event) => {
  const handlers = {
    reset: resetState,
    update: updateState
  }

  const handler = handlers[event.type] || R.identity
  return handler(state, event)
}


/**
 *
 */
const useSelection = () => {
  const { selection, featureStore } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})

  React.useEffect(() => {

    // Get selected tuples along with locked state and
    // reset component state.
    const handleSelection = async () => {
      const keys = selection.selected()

      // Not map features, but objects in general:
      const features = await featureStore.dictionary(keys)
      const locks = await featureStore.dictionary(keys.map(lockedId), key => associatedId(key))
      dispatch({ type: 'reset', features, locks })
    }

    // Update component state from database update.
    const handleBatch = ({ operations }) => dispatch({ type: 'update', operations })

    selection.on('selection', handleSelection)
    featureStore.on('batch', handleBatch)
    handleSelection() // handle initial selection

    return () => {
      featureStore.off('batch', handleBatch)
      selection.off('selection', handleSelection)
    }
  }, [selection, featureStore])

  return state
}


/**
 *
 */
export const Properties = () => {
  const state = useSelection()

  const panel = propertiesPanels[state.propertiesClass] || null
  if (!panel) return null

  return (
    <div className='feature-properties'>
      <div className='panel-inset'>
        <GridCols2>
          <MarginTop3/>
            { panel({ ...state }) }
        </GridCols2>
      </div>
    </div>
  )
}
