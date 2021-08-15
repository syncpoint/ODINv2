import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'
import { List, useListStore, strategy } from './List'
import { Search } from './Search'

export const CommandPalette = props => {
  const { paletteEntries, featureSnapshot } = useServices()
  const ref = React.useRef()

  const { state, dispatch, fetch } = useListStore({
    strategy: strategy.singleselect,
    fetch: (filter) => {
      return paletteEntries.entries()
        .filter(command => !filter || command.description().toLowerCase().includes(filter.toLowerCase()))
        .map(command => [command.id(), command])
    }
  })

  const commands = state.entries.reduce((acc, [id, value]) => {
    acc[id] = value
    return acc
  }, {})

  if (state.focusId) {
    commands[state.focusId].invoke()
  }

  React.useEffect(() => {
    const handler = () => fetch()
    paletteEntries.on('palette/entries', handler)
    return () => paletteEntries.off('palette/entries', handler)
  }, [dispatch])


  const handleSearch = value => dispatch({ path: 'filter', filter: value.toLowerCase() })
  const handleOpen = command => console.log('onOpen', command)
  const handleEnter = command => console.log('onEnter', command)
  const handleFocus = () => dispatch({ path: 'focus' })
  const handleBlur = ({ currentTarget, relatedTarget }) => {
    if (currentTarget.contains(relatedTarget)) return
    props.onBlur()
  }

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp', ' '].includes(key)) event.preventDefault()

    if (state.focusId && key === 'Enter') handleEnter(commands[state.focusId])
    if (key === 'Escape') featureSnapshot.restore()

    dispatch({ path: `keydown/${key}`, shiftKey, metaKey })
    props.onKeyDown(event)
  }

  /* eslint-disable react/prop-types */
  const entry = props => {
    return (
      <div
        key={props.key}
        ref={props.ref}
        role='option'
        onClick={props.handleClick}
        style={{ backgroundColor: props.focused ? 'lightgrey' : 'white' }}
      >
        <span>{props.value.description()}</span>
      </div>
    )
  }
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
          multiselect={true}
          entry={entry}
          onOpen={handleOpen}
          onEnter={handleEnter}
          dispatch={dispatch}
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
