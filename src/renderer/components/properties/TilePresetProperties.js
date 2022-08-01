/* eslint-disable react/prop-types */
import React from 'react'
import SortableList, { SortableItem } from 'react-easy-sort'
import Icon from '@mdi/react'
import { mdiDrag, mdiEye, mdiEyeOff } from '@mdi/js'
import { useServices, useList } from '../hooks'
import { Card } from '../Card'
import Range from './Range'
import FlexRow from './FlexRow'
import FlexColumn from './FlexColumn'
import MarginTop3 from './MarginTop3'
import './TilePresetProperties.css'


/**
 *
 */
const Opacity = props => {
  if (!props.selected) return null

  // Prevent drag start on parent (card):
  const stopPropagation = event => event.stopPropagation()

  return (
    <>
      <MarginTop3/>
      <label style={{ fontSize: '0.8rem' }}>Opacity</label>
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
    </>
  )
}

console.log('Card', Card)
console.log('FlexColumn', FlexColumn)
console.log('FlexRow', FlexRow)

/**
 *
 */
const Layer = props => (
  <SortableItem>

    {/* react-easy-sort kills list style => add necessary margins.  */}
    <Card
      id={props.id}
      style={{ marginTop: '8px', marginBottom: '8px' }}
      onClick={props.onSelect}
      selected={props.selected}
    >
      <FlexColumn>
        <FlexRow>
          <Icon path={mdiDrag} size='24px'/>
          <Card.Description>{props.name}</Card.Description>
          <Icon
            path={props.visible ? mdiEye : mdiEyeOff}
            size='24px'
            style={{ marginLeft: 'auto' }}
            onClick={props.onToggleVisible}
          />
        </FlexRow>
        <Opacity
          opacity={props.opacity}
          selected={props.selected}
          onChange={props.onOpacityChange}
        />
      </FlexColumn>
    </Card>
  </SortableItem>
)


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

  // TODO: debounce?
  const handleOpacityChange = id => ({ target }) => {
    const opacity = Number.parseFloat(target.value)
    tileLayerStore.updateOpacity(props.preset, id, opacity)
  }

  const handleToggleVisible = id => event => {
    // Also prevent drag start on parent (card):
    event.stopPropagation()
    tileLayerStore.toggleVisible(props.preset, id)
  }

  const layers = list.entries.map(entry =>
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
      onSortEnd={handleSortEnd}
      draggedItemClassName='tile-layer-item--dragged'
      tabIndex={0}
    >
      {layers}
    </SortableList>
  )
}


/**
 *
 */
const TilePresetProperties = props => (
  <LayerList preset={Object.entries(props.features)[0]}/>
)

export default TilePresetProperties
