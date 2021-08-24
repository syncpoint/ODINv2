import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'
import { initialState, singleselect } from './list-state'
import { SearchInput, List, reducer } from '.'
import { isFeatureId } from '../ids'


/**
 *
 */
export const CommandPalette = props => {
  const { selection, layerStore, paletteCommands } = useServices()
  const [featuresSnapshot, setFeaturesSnapshot] = React.useState()
  const [filter, setFilter] = React.useState('')
  const [state, dispatch] = React.useReducer(reducer(singleselect), initialState)

  const handleBlur = ({ currentTarget, relatedTarget }) => {
    if (currentTarget.contains(relatedTarget)) return
    props.onBlur()
  }

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey, ctrlKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    // On Escape key, reset features to stored snapshot:
    if (key === 'Escape') layerStore.updateEntries(featuresSnapshot)

    // On Enter key, apply command for good, i.e. no dry run:
    if (key === 'Enter' && state.focusIndex !== -1) {
      state.entries[state.focusIndex].invoke(false)
    }

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
    props.onKeyDown(event)
  }

  const handleClick = id => ({ metaKey, shiftKey, ctrlKey }) => {
    dispatch({ type: 'click', id, shiftKey, metaKey, ctrlKey })
  }

  const handleSearch = value => {
    setFilter(value.toLowerCase())
  }

  /**
   * Store feature properties snapshot of all selected features.
   * This happens once throughout the lifecycle of palette.
   */
  React.useEffect(() => {
    (async () => {
      // Get properties snapshot of currently selected features:
      const snapshot = await selection.selected().reduce(async (acc, id) => {
        if (!isFeatureId(id)) return acc

        const feature = await layerStore.getEntry(id)
        const features = await acc
        features.push(feature)
        return features
      }, [])

      setFeaturesSnapshot(snapshot)
    })()
  }, [layerStore, selection])


  /**
   * Filter command entries based on features snapshot and current filter.
   */
  React.useEffect(() => {
    const commands = paletteCommands.getCommands(featuresSnapshot).filter(command => {
      if (!filter) return true
      return command.description().toLowerCase().includes(filter)
    })

    dispatch({ type: 'entries', entries: commands })
  }, [filter, featuresSnapshot, paletteCommands])

  const ref = React.useRef()

  /* eslint-disable react/prop-types */
  const child = props => (
    <div
      key={props.id}
      ref={props.ref}
      role='option'
      onClick={handleClick(props.id)}
      style={{ backgroundColor: props.focused ? 'lightgrey' : 'white' }}
    >
      <span>{props.entry.description()}</span>
    </div>
  )
  /* eslint-enable react/prop-types */

  // Invoke command for newly focused entry (state.focusId):
  React.useEffect(() => {
    if (state.focusIndex === -1) return
    state.entries[state.focusIndex].invoke(true)
  }, [state.focusIndex, state.entries])

  return (
    <div
      className='spotlight-container fullscreen'
      onBlur={handleBlur}
    >
      <div
        className='spotlight panel'
        onKeyDown={handleKeyDown}
      >
        <div style={{ display: 'flex', padding: '6px' }}>
          <SearchInput onSearch={handleSearch}/>
        </div>
        <div className='list-container'>
          <List
            ref={ref}
            child={child}
            { ...state }
          />
        </div>
      </div>
    </div>
  )
}

CommandPalette.propTypes = {
  onBlur: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired
}
