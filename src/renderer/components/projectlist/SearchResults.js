import React from 'react'
import PropTypes from 'prop-types'
import { List } from './List'
import { useList } from '../hooks'
import User from './User'

const SearchResult = props => {
  const { entries } = props

  const [state, dispatch] = useList({ multiselect: true })

  React.useEffect(() => {
    if (entries) dispatch({ type: 'entries', entries })
  }, [entries, dispatch])

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey, ctrlKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  /* eslint-disable react/prop-types */
  const candidate = props => {
    const { entry } = props
    return (
      <User entry={entry} />
    )
  }

  return (
    <div onKeyDown={handleKeyDown} style={{ marginTop: '1rem' }}>
      <List child={candidate} {...state} />
    </div>
  )
}

export default SearchResult
SearchResult.propTypes = {
  entries: PropTypes.arrayOf(Object),
  onInvite: PropTypes.func.isRequired
}
