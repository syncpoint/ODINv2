import React from 'react'
import PropTypes from 'prop-types'
import { useList, useServices } from './hooks'
import { FilterInput, VirtualizedList } from '.'


/**
 *
 */
export const CommandPalette = props => {
  const { selection, paletteCommands, store } = useServices()
  const [snapshot, setSnapshot] = React.useState()
  const [filter, setFilter] = React.useState(props.value)
  const [placeholder, setPlaceholder] = React.useState(props.placeholder)
  const [state, dispatch] = useList({ multiselect: true })

  React.useEffect(() => setFilter(props.value), [props.value])
  React.useEffect(() => setPlaceholder(props.placeholder), [props.placeholder])

  const handleBlur = ({ currentTarget, relatedTarget }) => {
    if (currentTarget.contains(relatedTarget)) return
    props.onBlur()
  }

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey, ctrlKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    // On Escape key, reset values to stored snapshot:
    if (key === 'Escape') store.replaceValues(snapshot)

    // On Enter key, apply command for good, i.e. no dry run:
    if (key === 'Enter') {
      if (state.focusIndex !== -1) state.entries[state.focusIndex].invoke(false)
      else if (props.callback) props.callback(filter)
    }

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
    props.onKeyDown(event)
  }

  const handleFilterChange = React.useCallback(value => {
    setFilter(value)
  }, [])

  /**
   * Store feature properties snapshot of all selected features.
   * This happens once throughout the lifecycle of palette.
   */
  React.useEffect(() => {
    (async () => {
      // Get properties snapshot of currently selection:
      // snapshot :: [value]
      const snapshot = await store.getValues(selection.selected())
      setSnapshot(snapshot)
    })()
  }, [store, selection])


  /**
   * Filter command entries based on features snapshot and current filter.
   */
  React.useEffect(() => {
    // TODO: 1bc7d4e8-f294-4917-ab6c-a6bd541b49c5 - Command Palette: fuzzy search, incl. highlighting (Fuse.js)
    const isMatch = command => command.description().toLowerCase().includes(filter.toLowerCase())
    const commands = paletteCommands.getCommands(snapshot)
      .filter(command => !filter || isMatch(command))

    dispatch({ type: 'entries', entries: commands })
  }, [dispatch, filter, snapshot, paletteCommands])


  /* eslint-disable react/prop-types */
  const child = React.useCallback(props => {
    const handleClick = id => ({ metaKey, shiftKey, ctrlKey }) => {
      dispatch({ type: 'click', id, shiftKey, metaKey, ctrlKey })
    }

    const backgroundColor = props.focused ? 'lightgrey' : 'white'
    return (
      <div
        key={props.id}
        ref={props.ref}
        role='option'
        onClick={handleClick(props.id)}
        style={{ backgroundColor, padding: '0px 8px' }}
      >
        <span>{props.entry.description()}</span>
      </div>
    )
  }, [dispatch])
  /* eslint-enable react/prop-types */

  // Invoke command for newly focused entry (state.focusId):
  React.useEffect(() => {
    if (state.focusIndex === -1) return
    state.entries[state.focusIndex].invoke(true)
  }, [state.focusIndex, state.entries])

  const list = props.value === undefined
    ? <VirtualizedList child={child} { ...state }/>
    : null

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
          <FilterInput
            onChange={handleFilterChange}
            value={props.value}
            placeholder={placeholder}
          />
        </div>
        { list }
      </div>
    </div>
  )
}

CommandPalette.propTypes = {
  onBlur: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  value: PropTypes.string, // edit mode value
  callback: PropTypes.func, // edit mode callback
  placeholder: PropTypes.string // edit mode, multiple values
}
