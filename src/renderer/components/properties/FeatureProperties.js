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

const { TabPane } = Tabs

export const FeatureProperties = () => {
  const { selection, store } = useServices()
  const [keys, setKeys] = React.useState([])
  const propertiesMemento = useMemento('ui.properties', { tab: 'properties' })

  React.useEffect(() => {
    selection.on('selection', async () => {
      const keys = selection.selected()
      setKeys(keys)

      const values = await store.selectProperties(keys)
      console.log('selected', values)

      const classNames = values.reduce((acc, value) => {
        const { sidc } = value.properties
        acc.push(MILSTD.className(sidc))
        return R.uniq(acc)
      }, [])

      console.log('classNames', classNames)
    })

    // No cleanup necessary; components listenes forever.
  }, [selection, store])

  const handleTabChange = key => {
    const { value } = propertiesMemento
    propertiesMemento.put({ ...value, tab: key })
  }

  const tabs = () => (
    <div className='panel-right panel'>
      <div className='panel-inset'>
        { /* TODO: remember last active tab */ }
        <Tabs defaultActiveKey={propertiesMemento.value.tab} onChange={ handleTabChange }>
          <TabPane tab='Properties' key='properties'>
            {/* <Panel> */}
              <GridCols2>
                <MarginTop3/>
                {/* <UnitProperties/> */}
                {/* <EquipmentProperties/> */}
                <InstallationProperties/>
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

  const panel = keys.length
    ? tabs()
    : null

  return panel
}
