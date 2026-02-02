/* eslint-disable react/prop-types */
import React from 'react'
import Icon from '@mdi/react'
import { mdiClose } from '@mdi/js'
import { useServices, useMemento } from '../hooks'
import { defaultSearch } from './state'
import { matcher, stopPropagation } from '../events'
import { cmdOrCtrl } from '../../platform'
import { preventDefault } from 'ol/events/Event'
import './FilterInput.css'


/**
 *
 */
export const FilterInput = props => {
  const { searchIndex } = useServices()
  const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)
  const [cursor, setCursor] = React.useState(null)
  const [userTags, setUserTags] = React.useState([])
  const ref = React.useRef()

  React.useEffect(() => {
    const input = ref.current
    const position = cursor === null
      ? search.filter.length
      : cursor

    if (input) input.setSelectionRange(position, position)
  }, [ref, cursor, search.filter])

  // Fetch user tags and listen for index updates
  React.useEffect(() => {
    const fetchTags = async () => {
      const tags = await searchIndex.userTags()
      setUserTags(tags)
    }

    fetchTags()
    searchIndex.on('index/updated', fetchTags)
    return () => searchIndex.off('index/updated', fetchTags)
  }, [searchIndex])

  const handleChange = event => {
    const { target } = event
    setCursor(target.selectionStart)
    setSearch({ ...search, filter: target.value })
  }

  const handleTagClick = tag => {
    const tagFilter = `#${tag.toUpperCase()}`
    const tokens = search.filter.split(' ').filter(Boolean)
    const tagIndex = tokens.findIndex(t => t.toUpperCase() === tagFilter)

    const newFilter = tagIndex >= 0
      ? tokens.filter((_, i) => i !== tagIndex).join(' ')
      : search.filter ? `${search.filter} ${tagFilter}` : tagFilter

    setCursor(null)
    setSearch({ ...search, filter: newFilter, force: true })
  }

  const handleClear = event => {
    event.stopPropagation()
    setCursor(null)
    setSearch({ ...search, filter: '' })
    ref.current?.focus()
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
    <>
      <div className='fe6e-filter-container'>
        <input
          className='fe6e-filter'
          type='text'
          ref={ref}
          placeholder='Search'
          value={search.filter}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={stopPropagation}
          id='filter-input'
        />
        {search.filter && (
          <span className='fe6e-filter-clear' onClick={handleClear}>
            <Icon path={mdiClose} size={0.7} />
          </span>
        )}
      </div>
      {userTags.length > 0 && (
        <div className='fe6e-taglist'>
          {userTags.map(tag => (
            <span
              key={tag}
              className='fe6e-taglist-tag'
              onClick={() => handleTagClick(tag)}
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
