import * as R from 'ramda'
import React from 'react'
import { Tabs } from 'antd'
import { useServices, useMemento } from '../hooks'
import * as MILSTD from '../../symbology/2525c'
import GridCols2 from './GridCols2'
import MarginTop3 from './MarginTop3'
import UnitProperties from './UnitProperties'
import EquipmentProperties from './EquipmentProperties'
import InstallationProperties from './InstallationProperties'
import ActivityProperties from './ActivityProperties'
import GraphicsProperties from './GraphicsProperties'
import PointProperties from './PointProperties'
import { isFeatureId } from '../../ids'

const { TabPane } = Tabs

const classes = {
  UNIT: props => <UnitProperties {...props}/>,
  EQUIPMENT: props => <EquipmentProperties {...props}/>,
  INSTALLATION: props => <InstallationProperties {...props}/>,
  ACTIVITY: props => <ActivityProperties {...props}/>,
  GRAPHICS: props => <GraphicsProperties {...props}/>,
  POINT: props => <PointProperties {...props}/>
}

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
  const [className, setClassName] = React.useState(null)
  const propertiesMemento = useMemento('ui.properties', { tab: 'properties' })

  React.useEffect(() => {
    selection.on('selection', async () => {
      const keys = selection
        .selected()
        .filter(isFeatureId)

      const state = await store.selectFeatures(keys)
      dispatch({ type: 'reset', state })

      const classNames = state.reduce((acc, value) => {
        const { sidc } = value.properties
        const className = MILSTD.className(sidc)
        if (className) acc.push(className)
        else console.warn('missing class name: ', value)
        return R.uniq(acc)
      }, [])

      if (classNames.length === 1) setClassName(classNames[0])
      else setClassName(null)
    })

    store.on('batch', ({ operations }) => dispatch({ type: 'update', operations }))

    // No cleanup necessary; components listenes forever.
  }, [selection, store])

  const handleTabChange = key => {
    const { value } = propertiesMemento
    propertiesMemento.put({ ...value, tab: key })
  }

  const tabs = properties => (
    <div className='panel-right panel'>
      <div className='panel-inset'>
        { /* TODO: remember last active tab */ }
        <Tabs defaultActiveKey={propertiesMemento.value.tab} onChange={ handleTabChange }>
          <TabPane tab='Properties' key='properties'>
            {/* <Panel> */}
              <GridCols2>
                <MarginTop3/>
                { properties({ state })}
              </GridCols2>
            {/* </Panel> */}
          </TabPane>
          <TabPane tab='Styles' key='styles'>
            Styles...
          </TabPane>
        </Tabs>
      </div>
    </div>
  )

  const panel = className != null
    ? classes[className]
      ? tabs(classes[className])
      : null // TODO: fallback
    : null // TODO: fallback

  return panel
}
