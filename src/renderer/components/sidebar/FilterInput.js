/* eslint-disable react/prop-types */
import React from 'react'
import TextField from '../properties/TextField'
import { useMemento } from '../hooks'
import { defaultSearch } from './state'
import { matcher, stopPropagation } from '../events'
import { cmdOrCtrl } from '../../platform'
import { preventDefault } from 'ol/events/Event'


/**
 *
 */
export const FilterInput = props => {
  const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)
  const [cursor, setCursor] = React.useState(null)
  const ref = React.useRef()

  React.useEffect(() => {
    const input = ref.current
    const position = cursor === null
      ? search.filter.length
      : cursor

    if (input) input.setSelectionRange(position, position)
  }, [ref, cursor, search.filter])

  const handleChange = event => {
    const { target } = event
    setCursor(target.selectionStart)
    setSearch({ history: search.history, filter: target.value })
  }


  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'Enter',
      ({ key }) => key === 'Escape',
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp',
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End',
      ({ key }) => key === ' ',
      event => cmdOrCtrl(event) && event.key === 'a'
    ], stopPropagation)(event)

    matcher([
      ({ key }) => key === 'ArrowDown'
    ], preventDefault)(event)

    if (event.key === 'Enter') {
      setSearch({ ...search, force: true })
    } else if (event.key === 'Escape') {
      if (search.filter) setSearch({ ...search, filter: '' })
    } else if (event.key === 'ArrowDown') {
      document.getElementsByClassName('e3de-list-container')[0].focus()
      props.onFocus()
    }
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <TextField
        ref={ref}
        label='Search'
        value={search.filter}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={stopPropagation}
      />
    </div>
  )
}
