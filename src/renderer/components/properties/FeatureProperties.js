/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import { useServices, useMemento } from '../hooks'
import * as MILSTD from '../../symbology/2525c'
import { isFeatureId, lockedId, featureId, isLockedFeatureId } from '../../ids'
import PropertiesTab from './PropertiesTab'
import './FeatureProperties.css'

const reducer = (state, event) => {
  switch (event.type) {
    case 'reset': return {
      features: event.features,
      locked: event.locked
    }

    case 'update': {
      const features = event.features.reduce((acc, operation) => {
        if (!isFeatureId(operation.key)) return acc

        const update = ({ key, value }) => {
          if (!value.geometry && acc[key]) {
            const geometry = acc[key].geometry
            acc[key] = value
            acc[key].geometry = geometry
          } else acc[key] = value
        }

        switch (operation.type) {
          case 'put': update(operation); break
          case 'del': delete acc[operation.key]; break
        }

        return acc
      }, { ...state.features })

      const locked = event.locked.reduce((acc, operation) => {
        if (!isLockedFeatureId(operation.key)) return acc

        switch (operation.type) {
          case 'put': acc[operation.key] = operation.value; break
          case 'del': delete acc[operation.key]; break
        }

        return acc
      }, { ...state.locked })

      return {
        features,
        locked
      }
    }

    default: return state
  }
}


export const FeatureProperties = () => {
  const { selection, featureStore } = useServices()
  const initialState = {
    features: {},
    locked: {}
  }

  const [state, dispatch] = React.useReducer(reducer, initialState)
  const [featureClass, setFeatureClass] = React.useState(null)
  const memento = useMemento('ui.properties', { tab: 'properties' })

  React.useEffect(() => {
    selection.on('selection', async () => {
      const keys = selection
        .selected()
        .filter(isFeatureId)

      const featureTuples = await featureStore.tuples(keys)
      const features = featureTuples.reduce((acc, [key, feature]) => {
        acc[key] = feature
        acc[key].id = key
        return acc
      }, {})

      const locked = await featureStore.tuples(keys.map(lockedId))
      dispatch({ type: 'reset', features, locked: Object.fromEntries(locked) })

      const featureClasses = Object.values(features).reduce((acc, value) => {
        const sidc =
          value &&
          value.properties &&
          value.properties.sidc

        const className = MILSTD.className(sidc)
        if (className) acc.push(className)
        return R.uniq(acc)
      }, [])

      if (featureClasses.length === 1) setFeatureClass(featureClasses[0])
      else setFeatureClass(null)
    })

    featureStore.on('batch', ({ operations }) => {
      const selected = selection.selected().filter(isFeatureId)
      const features = operations.filter(op => selected.includes(op.key))

      // Note: May include 'hidden+feature' and similar.
      const locked = operations.filter(op => selected.includes(featureId(op.key)))
      dispatch({ type: 'update', features, locked })
    })

    // No cleanup necessary; component listenes forever.
  }, [selection, featureStore])

  const activeTab = memento.value && memento.value.tab

  const tab = () => {
    const disabled = Object.keys(state.locked).length > 0
    switch (activeTab) {
      case 'properties': return <PropertiesTab featureClass={featureClass} features={state.features} disabled={disabled}/>
      default: return null
    }
  }

  const panel = () =>
    <div className='feature-properties'>
      <div className='panel-inset'>
        { tab() }
      </div>
    </div>

  return featureClass !== null
    ? panel()
    : null
}
