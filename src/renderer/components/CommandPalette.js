import * as R from 'ramda'
import React from 'react'
import { useServices } from './services'
import { List, useListStore } from './List'
import { Search } from './Search'
import { multiselect } from './multiselect'

export const CommandPalette = () => {
  const { emitter, paletteEntries } = useServices()
  const [visible, setVisible] = React.useState(false)
  const ref = React.useRef()

  const { state, dispatch, fetch } = useListStore({
    strategy: multiselect,
    fetch: (filter) => {
      const xs = paletteEntries.entries()
        .map(command => [command.id(), command.description()])
        .filter(([_, description]) => !filter || description.toLowerCase().includes(filter.toLowerCase()))
      return xs
    }
  })

  React.useEffect(() => {
    const handler = () => fetch()
    paletteEntries.on('palette/entries', handler)
    return () => paletteEntries.off('palette/entries', handler)
  }, [dispatch])


  React.useEffect(() => {
    const handleCommand = event => {
      switch (event.type) {
        case 'open-command-palette': return setVisible(true)
        case 'escape': return setVisible(false)
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [])

  const handleSearch = value => dispatch({ path: 'filter', filter: value.toLowerCase() })
  const handleFocusList = () => ref.current.focus()
  const handleOpen = command => console.log('onOpen', command)
  const handleEnter = command => console.log('onEnter', command)
  const handleFocus = command => console.log('onFocus', command)

  const handleKeyDown = event => {
    if (event.key === 'Escape') return setVisible(false)
  }

  /* eslint-disable react/prop-types */
  const renderEntry = props => {
    return (
      <div
        key={props.id}
        ref={props.ref}
        role='option'
        onClick={props.handleClick}
        style={{ backgroundColor: props.focused ? 'lightgrey' : 'white' }}
      >
        <span>{props.entry}</span>
      </div>
    )
  }
  /* eslint-enable react/prop-types */

  return visible
    ? <div className='palette-container fullscreen'>
        <div
          className='palette panel'
          onKeyDown={handleKeyDown}
        >
          <div
           style={{ display: 'flex', gap: '8px', padding: '8px' }}
          >
            <Search onSearch={handleSearch} onFocusList={handleFocusList}/>
          </div>
          <List
            ref={ref}
            multiselect={true}
            renderEntry={renderEntry}
            onFocus={handleFocus}
            onOpen={handleOpen}
            onEnter={handleEnter}
            // onBack={handleBack}
            // onSelect={handleSelect}
            dispatch={dispatch}
            style={{ height: '100%' }}
            { ...state }
          />
        </div>
      </div>
    : null
}
