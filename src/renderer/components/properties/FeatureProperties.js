/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import { useServices, useMemento } from '../hooks'
import * as MILSTD from '../../symbology/2525c'
import { isFeatureId } from '../../ids'
// import TabContainer from './TabContainer'
// import TabButton from './TabButton'
import PropertiesTab from './PropertiesTab'


const reducer = (state, event) => {
  switch (event.type) {
    case 'reset': return event.state.reduce((acc, feature) => {
      acc[feature.id] = feature
      return acc
    }, {})

    case 'update': {
      return event.operations.reduce((acc, operation) => {
        switch (operation.type) {
          case 'put': acc[operation.key] = operation.value; break
          case 'del': delete acc[operation.key]; break
        }
        return acc
      }, { ...state })
    }

    default: return state
  }
}


export const FeatureProperties = () => {
  const { selection, store } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})
  const [featureClass, setFeatureClass] = React.useState(null)
  const memento = useMemento('ui.properties', { tab: 'properties' })

  React.useEffect(() => {
    selection.on('selection', async () => {
      const keys = selection
        .selected()
        .filter(isFeatureId)

      const state = await store.selectFeatures(keys)
      dispatch({ type: 'reset', state })

      const featureClasses = state.reduce((acc, value) => {
        const { sidc } = value.properties
        const className = MILSTD.className(sidc)
        if (className) acc.push(className)
        else console.warn('missing class name: ', value)
        return R.uniq(acc)
      }, [])

      if (featureClasses.length === 1) setFeatureClass(featureClasses[0])
      else setFeatureClass(null)
    })

    store.on('batch', ({ operations }) => dispatch({ type: 'update', operations }))

    // No cleanup necessary; components listenes forever.
  }, [selection, store])

  // const handleTabClick = tab => () => {
  //   const { value } = memento
  //   memento.put({ ...value, tab })
  // }

  const activeTab = memento.value && memento.value.tab

  const tab = () => {
    switch (activeTab) {
      case 'properties': return <PropertiesTab featureClass={featureClass} features={state}/>
      default: return null
    }
  }

  const panel = () =>
    <div className='panel-right panel'>
      {/* <TabContainer>
        <TabButton
          active={activeTab === 'properties'}
          onClick={handleTabClick('properties')}
        >
          Properties
        </TabButton>
        <TabButton
          active={activeTab === 'comment'}
          onClick={handleTabClick('comment')}
        >
          Comment
        </TabButton>
        <TabButton
          active={activeTab === 'style'}
          onClick={handleTabClick('style')}
        >
          Style
        </TabButton>
      </TabContainer> */}
      <div className='panel-inset'>
        { tab() }
      </div>
    </div>

  return featureClass !== null
    ? panel()
    : null
}
