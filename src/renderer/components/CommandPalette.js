import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'
import { List, initialState, reducer } from './List'
import { singleselect } from './singleselect'
import { Search } from './Search'


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
    const { key, shiftKey, metaKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp', ' '].includes(key)) event.preventDefault()

    // On Escape key, reset features to stored snapshot:
    if (key === 'Escape') {
      const properties = Object.entries(featuresSnapshot).map(([id, properties]) => ({ id, properties }))
      layerStore.updateProperties(properties)
    }

    // On Enter key, apply command for good, i.e. no dry run:
    if (key === 'Enter' && state.focusIndex !== -1) {
      state.entries[state.focusIndex].invoke(false)
    }

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey })
    props.onKeyDown(event)
  }

  const handleClick = id => ({ metaKey, shiftKey }) => {
    dispatch({ type: 'click', id, shiftKey, metaKey })
  }

  const handleSearch = value => {
    setFilter(value.toLowerCase())
  }

  /**
   * Store feature properties snapshot of all selected features.
   * This happens once throughout the lifecycle of palette.
   */
  React.useEffect(async () => {
    // Get properties snapshot of currently selected features:
    const snapshot = await selection.selected().reduce(async (acc, id) => {
      const properties = await layerStore.getFeatureProperties(id)
      const features = await acc
      features[id] = properties
      return features
    }, {})

    setFeaturesSnapshot(snapshot)
  }, [])


  /**
   * Filter command entries based on features snapshot and current filter.
   */
  React.useEffect(async () => {
    const commands = paletteCommands.getCommands(featuresSnapshot).filter(command => {
      if (!filter) return true
      return command.description().toLowerCase().includes(filter)
    })

    dispatch({ type: 'entries', entries: commands, reset: false })
  }, [filter, featuresSnapshot])

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

  if (state.focusIndex !== -1) {
    state.entries[state.focusIndex].invoke(true)
  }

  return (
    <div
      className='palette-container fullscreen'
      onBlur={handleBlur}
    >
      <div
        className='palette panel'
        onKeyDown={handleKeyDown}
      >
        <div
          style={{ display: 'flex', gap: '8px', padding: '8px' }}
        >
          <Search onSearch={handleSearch}/>
        </div>
        <List
          ref={ref}
          child={child}
          { ...state }
        />
      </div>
    </div>
  )
}

CommandPalette.propTypes = {
  onBlur: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired
}
