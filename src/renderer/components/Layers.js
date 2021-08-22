import React from 'react'
import { SearchInput, List, reducer, Card } from '.'
import { useServices } from './services'
import { initialState, multiselect } from './list-state'

/**
 *
 */
export const Layers = () => {
  const { searchIndex, selection } = useServices()
  const [filter, setFilter] = React.useState('')
  const [state, dispatch] = React.useReducer(reducer(multiselect), initialState)

  const handleSearch = value => setFilter(value)

  const handleChange = React.useCallback(({ result }) => {
    (async () => {
      const entries = await result
      dispatch({ type: 'entries', entries })
    })()
  }, [dispatch])

  React.useEffect(() => {
    const pendingQuery = (async () => {
      const query = await searchIndex.query(`@feature ${filter}`)
      query.on('change', handleChange)
      const entries = await query.getResult()
      dispatch({ type: 'entries', entries })
      return query
    })()

    return async () => {
      const query = await pendingQuery
      query.off('change', handleChange)
      query.dispose()
    }
  }, [filter, handleChange, searchIndex])

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

  const handleClick = id => ({ metaKey, shiftKey }) => {
    dispatch({ type: 'click', id, shiftKey, metaKey })
  }

  const handleRename = value => console.log('handleRename', value)

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp'].includes(key)) event.preventDefault()

    dispatch({ type: `keydown/${key}`, shiftKey, metaKey })
  }

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
        <Card.Content>
          <Card.Title value={entry.title} onChange={handleRename}/>
          <Card.Description value={entry.description}/>
        </Card.Content>
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
        <SearchInput size='large' onSearch={handleSearch}/>
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
