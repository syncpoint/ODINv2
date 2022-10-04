/* eslint-disable react/prop-types */
import React from 'react'
import { useServices } from '../hooks'
import * as ID from '../../ids'
import LayerStyles from './LayerStyles'
import './Properties.css'


const stylesPanels = {
  'style+layer': props => <LayerStyles {...props}/>
}

/**
 *
 */
const useSelection = () => {
  const { selection, store } = useServices()
  const [style, setStyle] = React.useState([]) // [k, v]

  React.useEffect(() => {

    const handleSelection = async () => {
      // // D := dictionary, associative array
      // const D = async kv => (await kv).reduce((acc, [key, value]) => { acc[key] = value; return acc }, {})

      // Only support singleselect for the time being:
      const keys = selection.selected().filter(ID.isStylableId).map(ID.styleId)
      if (keys.length !== 1) return setStyle([])

      const key = keys[0]
      const value = await store.value(key, {})
      setStyle([key, value])
    }

    // Update component state from database update.
    const handleBatch = ({ operations }) => {
      const keys = selection.selected().map(ID.styleId)
      const relevant = operations
        .filter(({ type }) => type === 'put')
        .filter(({ key }) => keys.includes(key))

      if (relevant.length !== 1) setStyle([])
      else {
        const { key, value } = relevant[0]
        setStyle([key, value])
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

  return style
}


/**
 *
 */
export const Styles = () => {
  const style = useSelection() // [k, v]
  const scope = ([key]) => key ? ID.scope(key) : null
  const panel = stylesPanels[scope(style)] || null
  if (!panel) return null

  return (
    <div className='feature-properties'>
      { panel({ style }) }
    </div>
  )
}
