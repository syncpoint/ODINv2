import React from 'react'
import { SearchInput, List, reducer, Card, TagList, Avatar } from '.'
import { useServices } from './services'
import { initialState, multiselect } from './list-state'


/**
 *
 */
export const Layers = () => {
  const { searchIndex, selection, propertiesStore } = useServices()
  const [scope, setScope] = React.useState('feature')
  const [filter, setFilter] = React.useState('')
  const [state, dispatch] = React.useReducer(reducer(multiselect), initialState)

  const handleFilterChange = value => setFilter(value)
  const handleClick = id => ({ metaKey, shiftKey }) => dispatch({ type: 'click', id, shiftKey, metaKey })


  // >>= QUERY/RESULT
  // Open new query, dispatch result list and listen for
  // changes on query result list due to search index updates.

  const handleQueryChange = React.useCallback(({ result }) => {
    (async () => {
      const entries = await result
      dispatch({ type: 'entries', entries })
    })()
  }, [])

  React.useEffect(() => {
    const pendingQuery = (async () => {
      const query = await searchIndex.query(`@${scope} ${filter}`)
      const entries = await query.getResult()
      dispatch({ type: 'entries', entries })

      // Start listening AFTER initial result was retrieved.
      query.on('change', handleQueryChange)
      return query
    })()

    // Release listener and free query resoures.
    return async () => {
      const query = await pendingQuery
      query.off('change', handleQueryChange)
      query.dispose()
    }
  }, [scope, filter, handleQueryChange, searchIndex])

  // <<= QUERY/RESULT


  // =>> SELECTION
  // Sync global selection with list state and vice versa.

  const handleSelection = React.useCallback(event => {
    dispatch({ type: 'selection', event })
  }, [])

  React.useEffect(() => {
    selection.on('selection', handleSelection)
    return () => selection.off('selection', handleSelection)
  }, [selection, handleSelection])

  React.useEffect(() => {
    selection.set(state.selected)
  }, [selection, state.selected])

  // <<= SELECTION



  const handleKeyDown = event => {
    const { key, shiftKey, metaKey, ctrlKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  const handleAddTag = id => name => propertiesStore.addTag(id, name)
  const handleRemoveTag = id => name => propertiesStore.removeTag(id, name)
  const handleRename = id => value => propertiesStore.rename(id, value)

  /* eslint-disable react/prop-types */
  const child = props => {
    const { entry } = props

    return (
      <Card
        key={props.id}
        ref={props.ref}
        onClick={handleClick(props.id)}
        focused={props.focused}
        selected={props.selected}
      >
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Card.Content>
            <Card.Title value={entry.title} onChange={handleRename(props.id)}/>
            <Card.Description value={entry.description}/>
          </Card.Content>
          { (entry.url || entry.path) && <Avatar url={entry.url} path={entry.path}/> }
        </div>
        <TagList
          id={props.id}
          tags={entry.tags}
          capabilities={entry.capabilities}
          onAdd={handleAddTag(props.id)}
          onRemove={handleRemoveTag(props.id)}
        />
      </Card>
    )
  }
  /* eslint-enable react/prop-types */

  const ref = React.useRef()

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', padding: '6px' }}>
        <SearchInput size='large' onSearch={handleFilterChange}/>
      </div>
      <div className='list-container'>
        <List
          ref={ref}
          child={child}
          { ...state }
        />
      </div>
    </div>
  )
}
