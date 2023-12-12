/* eslint-disable react/prop-types */
import React from 'react'
import SortableList, { SortableItem } from 'react-easy-sort'
import Icon from '@mdi/react'
import { mdiDrag, mdiEyeOutline, mdiEyeOff, mdiSquareOpacity, mdiTerrain } from '@mdi/js'
import { useServices, useList } from '../hooks'
import Range from './Range'
import { Tooltip } from 'react-tooltip'
import './TilePresetProperties.scss'


/**
 *
 */
const Opacity = props => {
  if (!props.selected) return null

  // Prevent drag start on parent (card):
  const stopPropagation = event => event.stopPropagation()

  return (
    <div className='bf12-opacity'>
      <label className='bf12-opacity__label'>Opacity</label>
      <Range
        min='0'
        max='1'
        step='0.05'
        value={props.opacity}
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        onChange={props.onChange}
      >
        <option value='0'>0%</option>
        <option value='1'>100%</option>
      </Range>
    </div>
  )
}


/**
 *
 */
const Layer = props => {

  // terrain data layers must not be invisible, thus we hide controls
  const icons = props.contentType?.includes('terrain')
    ? <Icon
        path={mdiTerrain}
        size='24px'
        className=' tt-tile-preset-terrain'
        style={{ marginLeft: 'auto' }}
      />
    : <>
        <Icon
            path={mdiSquareOpacity}
            size='24px'
            className=' tt-tile-preset-opacity'
            style={{ marginLeft: 'auto' }}
            onClick={props.onSelect}
          />
          <Icon
            path={props.visible ? mdiEyeOutline : mdiEyeOff}
            size='24px'
            onClick={props.onToggleVisible}
            className='tt-tile-preset-visibility'
          />
      </>

  return (<SortableItem>

    {/* react-easy-sort kills list style => add necessary margins.  */}
    <div
      className='bf12-card'
      aria-selected={props.selected}
    >
      <div className='bf12-column'>
        <div className='bf12-row'>
          <Icon path={mdiDrag} size='24px' className='tt-tile-preset-handle'/>
          <span className='bf12-card__description'>{props.name}</span>
          { icons }
          <Tooltip anchorSelect='.tt-tile-preset-opacity' content='Change the opacity' delayShow={750}/>
          <Tooltip anchorSelect='.tt-tile-preset-handle' content='Drag to change the order of visibility' delayShow={750}/>
          <Tooltip anchorSelect='.tt-tile-preset-visibility' content='Hide/Show this map' delayShow={750}/>
          <Tooltip anchorSelect='.tt-tile-preset-terrain' content='This layer contains terrain data' delayShow={750}/>
        </div>
        <Opacity
          opacity={props.opacity}
          selected={props.selected}
          onChange={props.onOpacityChange}
        />
      </div>
    </div>
  </SortableItem>
  )
}


/**
 *
 */
const LayerList = props => {
  const { tileLayerStore } = useServices()
  const [list, dispatch] = useList({ multiselect: false })

  React.useEffect(() => {
    dispatch({ type: 'entries', entries: props.preset[1] })
  }, [props.preset, dispatch])


  const handleSortEnd = (from, to) => {
    const entries = tileLayerStore.updateOrder(props.preset, from, to)

    // We have to (optimistically) update state to circumvent
    // rendering of immediate states (flickering).
    dispatch({ type: 'entries', entries })
  }

  const handleSelect = id => () => {
    const selected = list.selected.includes(id)
    if (selected) dispatch({ type: 'deselect' })
    else dispatch({ type: 'select', id })
  }

  const handleOpacityChange = id => ({ target }) => {
    const opacity = Number.parseFloat(target.value)
    tileLayerStore.updateOpacity(props.preset, id, opacity)
  }

  const handleToggleVisible = id => event => {
    // Also prevent drag start on parent (card):
    event.stopPropagation()
    tileLayerStore.toggleVisible(props.preset, id)
  }

  const layers = list.entries
    .map(entry =>
      <Layer
        key={entry.id}
        {...entry}
        selected={list.selected.includes(entry.id)}
        onSelect={handleSelect(entry.id)}
        onOpacityChange={handleOpacityChange(entry.id)}
        onToggleVisible={handleToggleVisible(entry.id)}
      />
    )

  // There seems to be no way to have decent CSS on list container.
  // We workaround this by applying ad-hoc styles.

  return (
    <SortableList
      className='bf12-list-container'
      onSortEnd={handleSortEnd}
      draggedItemClassName='bf12-tile-layer-item--dragged'
      tabIndex={0}
    >
      {layers}
    </SortableList>
  )
}


/**
 *
 */
const TilePresetProperties = props => {
  return (
  <LayerList preset={Object.entries(props.features)[0]}/>
  )
}

export default TilePresetProperties
