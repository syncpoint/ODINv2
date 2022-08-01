import React from 'react'
import TextField from '../properties/TextField'
import { useMemento } from '../hooks'
import { defaultSearch } from './state'


/**
 *
 */
export const FilterInput = () => {
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

  return (
    <div style={{ marginTop: '24px' }}>
      <TextField
        ref={ref}
        label='Search'
        value={search.filter}
        onChange={handleChange}
      />
    </div>
  )
}
