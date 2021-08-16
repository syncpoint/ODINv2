import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'
import { List, useListStore, strategy } from './List'
import { Search } from './Search'

export const CommandPalette = props => {
  const { paletteCommands, featureSnapshot } = useServices()
  const ref = React.useRef()

  const { state, dispatch, fetch } = useListStore({
    strategy: strategy.singleselect,
    fetch: (filter) => {
      return paletteCommands.entries()
        .filter(command => !filter || command.description().toLowerCase().includes(filter.toLowerCase()))
    }
  })

  const commands = state.entries.reduce((acc, entry) => {
    acc[entry.id] = entry
    return acc
  }, {})

  if (state.focusId) {
    commands[state.focusId].invoke()
  }

  React.useEffect(() => {
    const handler = () => fetch()
    paletteCommands.on('palette/entries', handler)
    return () => paletteCommands.off('palette/entries', handler)
  }, [dispatch])


  const handleSearch = value => dispatch({ path: 'filter', filter: value.toLowerCase() })
  const handleFocus = () => dispatch({ path: 'focus' })

  const handleBlur = ({ currentTarget, relatedTarget }) => {
    if (currentTarget.contains(relatedTarget)) return
    props.onBlur()
  }

  const handleClick = id => ({ metaKey, shiftKey }) => {
    dispatch({ path: 'click', id, shiftKey, metaKey })
  }

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp', ' '].includes(key)) event.preventDefault()
    if (key === 'Escape') featureSnapshot.restore()

    dispatch({ path: `keydown/${key}`, shiftKey, metaKey })
    props.onKeyDown(event)
  }

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

  return (
    <div
      className='palette-container fullscreen'
      onFocus={handleFocus}
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
