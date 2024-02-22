import React from 'react'
import { useServices } from '../hooks'
import * as ID from '../../ids'
import Select from './Select'

import './Properties.css'

const useSelection = () => {
  const { selection, store } = useServices()
  const [sharedLayer, setSharedLayer] = React.useState(null) // [k, v]

  React.useEffect(() => {

    const handleSelection = async () => {

      // Only support singleselect for the time being:
      const keys = selection.selected().filter(ID.isLayerId).map(ID.roleId)
      if (keys.length !== 1) return setSharedLayer(null)

      const key = keys[0]
      const role = await store.value(key, null)
      if (!role) return setSharedLayer(null)
      setSharedLayer({
        id: key,
        role
      })
    }

    // Update component state from database update.
    const handleBatch = ({ operations }) => {
      const keys = selection.selected().map(ID.roleId)
      const relevant = operations
        .filter(({ type }) => type === 'put')
        .filter(({ key }) => keys.includes(key))

      if (relevant.length !== 1) setSharedLayer(null)
      else {
        const { key, value } = relevant[0]
        setSharedLayer({
          id: key,
          role: value
        })
      }
    }

    selection.on('selection', handleSelection)
    store.on('batch', handleBatch)
    handleSelection() // handle initial selection

    return () => {
      store.off('batch', handleBatch)
      selection.off('selection', handleSelection)
    }
  }, [selection, store])

  return sharedLayer
}

const Sharing = props => {
  const { emitter, signals, store } = useServices()
  const [online, setOnline] = React.useState(true)
  const sharedLayer = useSelection()

  React.useEffect(() => {
    const operational = signals['replication/operational']

    const handler = () => setOnline(operational())
    const dispose = operational.on(handler)

    setOnline(operational())

    return () => dispose()
  }, [signals])

  const handleRoleChanged = async (event) => {
    const { value: defaultRole } = event.target
    console.log(defaultRole)
    const layerId = ID.containerId(sharedLayer.id)
    await store.import([{ type: 'put', key: sharedLayer.id, value: { self: sharedLayer.role.self, default: defaultRole } }])
    emitter.emit(`replication/changeDefaultRole/${layerId}/${defaultRole}`)

  }

  if (!sharedLayer) return null

  return (
    <div className='sharing-properties'>
      <div className='a0d5-panel'>
        <div className='a0d5-card'>
          Assigned role: { sharedLayer.role.self }
        </div>
        <div className='a0d5-card'>
          <label htmlFor='sharing-default-role'>Default role</label>
          <Select
            id='sharing-default-role'
            value={sharedLayer.role.default}
            disabled={!(['ADMINISTRATOR', 'OWNER'].includes(sharedLayer.role.self)) || !online}
            onChange={handleRoleChanged}
            >
            <option value='ADMINISTRATOR'>ADMINISTRATOR</option>
            <option value='CONTRIBUTOR'>CONTRIBUTOR</option>
            <option value='READER'>READER</option>
          </Select>
        </div>
      </div>
    </div>
  )
}

export {
  Sharing
}
