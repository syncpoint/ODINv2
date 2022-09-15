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
  const [styles, setStyles] = React.useState({})

  React.useEffect(() => {

    // Get selected tuples along with locked state and
    // reset component state.
    const handleSelection = async () => {
      const defaultStyle = await store.value('style+default')
      // D := dictionary, associative array
      const D = async kv => (await kv).reduce((acc, [key, value]) => { acc[key] = value; return acc }, {})
      const keys = selection.selected().filter(ID.isStylableId).map(ID.styleId)

      // Only support singleselect for the time being:
      if (keys.length !== 1) return setStyles({})

      const lookup = await D(store.tuplesJSON(keys))
      const styles = keys.reduce((acc, key) => {
        acc[key] = lookup[key] || defaultStyle
        return acc
      }, {})

      setStyles(styles)
    }

    // Update component state from database update.
    const handleBatch = ({ operations }) => {
      const keys = selection.selected().map(ID.styleId)
      const relevant = operations
        .filter(({ type }) => type === 'put')
        .filter(({ key }) => keys.includes(key))

      const fn = (acc, { key, value }) => ({ ...acc, [key]: value })
      if (relevant.length !== 1) setStyles({})
      else setStyles(styles => relevant.reduce(fn, styles))
    }

    selection.on('selection', handleSelection)
    store.on('batch', handleBatch)
    handleSelection() // handle initial selection

    return () => {
      store.off('batch', handleBatch)
      selection.off('selection', handleSelection)
    }
  }, [selection, store])

  return styles
}

const propertiesClass = styles => {
  const keys = Object.keys(styles)
  if (keys.length !== 1) return null
  else return ID.scope(keys[0])
}

/**
 *
 */
export const Styles = () => {
  const styles = useSelection()
  const panel = stylesPanels[propertiesClass(styles)] || null
  if (!panel) return null

  console.log(styles)
  return (
    <div className='feature-properties'>
      { panel({ ...styles }) }
    </div>
  )
}
