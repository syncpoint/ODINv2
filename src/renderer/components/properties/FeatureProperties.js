import React from 'react'
import { Tabs } from 'antd'
import { useServices, useMemento } from '../hooks'
import TextField from './TextField'
import Section from './Section'
import { MarginTop3, MarginBottom3, GridCols2, ColSpan2, SelectEchelon, HostilityStatus, Status, Modifiers, Reinforcement } from './composites'

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
                <ColSpan2>
                  <TextField label='Name'/>
                </ColSpan2>
                <TextField label='Unique Designation'/>
                <TextField label='Higher Formation'/>
                <TextField label='Special C2 HQ'/>
                <Section id='echelon' label='Echelon'>
                  <SelectEchelon/>
                </Section>
                <HostilityStatus/>
                <ColSpan2>
                  <TextField label='Date-Time Group'/>
                </ColSpan2>
                <TextField label='Speed'/>
                <TextField label='Direction'/>
                <ColSpan2>
                  <TextField label='Staff Comments'/>
                </ColSpan2>
                <ColSpan2>
                  <TextField label='Additional Information'/>
                </ColSpan2>
                <Status/>

                <ColSpan2>
                  <MarginTop3/>
                  <Section label='Modifiers'>
                    <GridCols2>
                      <Modifiers/>
                      <Reinforcement/>
                    </GridCols2>
                  </Section>
                  <MarginBottom3/>
                </ColSpan2>

                {/* <TextField label='Effective (From)'/>
                <TextField label='Effective (To)'/>
                <TextField label='Altitude/Depth (From)'/>
                <TextField label='Altitude/Depth (To)'/> */}
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
