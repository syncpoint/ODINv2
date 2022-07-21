/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import SortableList, { SortableItem } from 'react-easy-sort'
import arrayMove from 'array-move'
import Icon from '@mdi/react'
import { mdiDrag, mdiEye, mdiEyeOff } from '@mdi/js'
import { useServices, useList } from '../hooks'
import { Card } from '../Card'
import Range from './Range'
import FlexRow from './FlexRow'
import FlexColumn from './FlexColumn'
import MarginTop3 from './MarginTop3'
import * as ID from '../../ids'
import './TileLayersProperties.css'

/**
 *
 */
const fetchLayers = async (store, keys = []) => {

  // Get available tiles layers.
  const layers = await store.tuples(ID.tileLayerId())
  const serviceEntries = await store.tuples('tile-service:')
  const services = Object.fromEntries(serviceEntries)

  const layer = ([layerId, layer]) => {
    const service = services[ID.tileServiceId(layerId)]
    const name = layer.name || service.name
    return [layerId, {
      ...layer,
      type: service.type,
      name,
      serviceName: service.name
    }]
  }

  const availableLayers = layers.map(layer)
  const lookup = Object.fromEntries(availableLayers)

  // `keys` defines current order of tile layers.
  // Available layers may have changed (additions, removals).

  const currentOrder = keys.filter(key => lookup[key])
  const additions = availableLayers
    .filter(([key]) => !currentOrder.includes(key))
    .map(([key]) => key)

  const nextOrder = currentOrder.concat(additions)
  return nextOrder.map(key => [key, lookup[key]])
}

/**
 *
 */
const LayerList = props => {
  const { store } = useServices()
  const [list, dispatch] = useList({ multiselect: false })
  const [key, layerKeys] = props.layers

  // Listen for tile layer updates from store:
  //
  React.useEffect(() => {
    const handler = async ({ operations }) => {
      // Not efficient, but simple: reload entries if anything interesting changed.
      const [key, layerKeys] = props.layers
      const interesting = ['tile-layer']
      const scopes = R.uniq(
        operations
          .map(({ key }) => key)
          .map(ID.scope)
      )

      if (scopes.some(scope => interesting.includes(scope))) {
        const layers = await fetchLayers(store, layerKeys)
        const entries = layers.map(([id, layer]) => ({ ...layer, id }))
        dispatch({ type: 'entries', entries })
      }
    }

    store.on('batch', handler)
    return () => store.off('batch', handler)
  }, [store, dispatch, props.layers])

  React.useEffect(() => {
    (async () => {
      const [key, layerKeys] = props.layers
      const layers = await fetchLayers(store, layerKeys)
      const entries = layers.map(([id, layer]) => ({ ...layer, id }))
      dispatch({ type: 'entries', entries })
    })()
  }, [props.layers, dispatch, store])


  const onSortEnd = (oldIndex, newIndex) => {
    const entries = arrayMove(list.entries, oldIndex, newIndex)
    dispatch({ type: 'entries', entries })
    const layerIds = entries.map(({ id }) => id)
    store.update([key], [layerIds])
  }

  const children = list.entries.map(entry => {
    const handleCardClick = () => dispatch({ type: 'select', id: entry.id })

    // Prevent drag start on parent (card):
    const handleOpacityMouseDown = event => event.stopPropagation()

    // TODO: debounce
    const handleOpacityChange = ({ target }) => {
      const opacity = Number.parseFloat(target.value)
      if (opacity === entry.opacity) return

      const { id, hidden, name } = entry
      const layer = { hidden, name, opacity }
      store.update([id], [layer]) // TODO: support undo!
    }

    const toggleHidden = event => {
      // Also prevent drag start on parent (card):
      event.stopPropagation()
      const hidden = !entry.hidden
      const { id, name, opacity } = entry
      const layer = { hidden, name, opacity }
      store.update([id], [layer]) // TODO: support undo!
    }

    const hidden = entry.hidden
    const hideShowPath = hidden ? mdiEyeOff : mdiEye
    const selected = list.selected.includes(entry.id)
    const opacity = selected
      ? (
          <>
            <label style={{ fontSize: '0.8rem' }}>Opacity</label>
            <Range
              min='0'
              max='1'
              step='0.05'
              value={entry.opacity}
              onMouseDown={handleOpacityMouseDown}
              onChange={handleOpacityChange}
            >
              <option value='0'>0%</option>
              <option value='1'>100%</option>
            </Range>
          </>
        )
      : null

    return (
      <SortableItem key={entry.id}>

        {/* react-easy-sort kills list style => add necessary margins.  */}
        <Card
          id={entry.id}
          style={{ marginTop: '8px', marginBottom: '8px' }}
          onClick={handleCardClick}
          selected={selected}
        >
          <FlexColumn>
            <FlexRow>
              <Icon path={mdiDrag} size='24px'/>
              <Card.Description>{entry.name}</Card.Description>
              <Icon
                path={hideShowPath}
                size='24px'
                style={{ marginLeft: 'auto' }}
                onClick={toggleHidden}
              />
            </FlexRow>
            <MarginTop3/>
            { opacity }
          </FlexColumn>
        </Card>
      </SortableItem>
    )
  })


  return (
  // There seems to be no way to have decent CSS on list container.
  // We workaround this by applying ad-hoc styles.

    <SortableList
      onSortEnd={onSortEnd}
      draggedItemClassName='tile-layer-item--dragged'
      tabIndex={0}
    >
      {children}
    </SortableList>
  )
}

/**
 *
 */
const TileLayersProperties = props => {
  const { store } = useServices()
  const [layers, setLayers] = React.useState([])

  React.useEffect(() => {
    setLayers(Object.entries(props.features)[0])
  }, [props, store])

  return (
    <LayerList layers={layers}/>
  )
}

export default TileLayersProperties
