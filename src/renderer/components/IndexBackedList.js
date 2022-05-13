import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './hooks'
import { VirtualizedList, IndexEntry, Card } from '.'


/**
 * Filterable list of entries from search index (multiselect).
 */
const IndexBackedList = props => {
  const { searchIndex, selection } = useServices()
  const { scope, filter, dispatch, state } = props

  // >>= QUERY/RESULT
  // Open new query, dispatch result list and listen for
  // changes on query result list due to search index updates.

  React.useEffect(() => {
    const pendingQuery = (async () => {
      return await searchIndex.query(`${scope} ${filter}`, entries => {
        // Note: (multiselect) strategy makes sure that state is only
        // updated when entries are not deep equal.
        dispatch({ type: 'entries', entries })
      })
    })()

    return async () => {
      const query = await pendingQuery
      query.dispose()
    }
  }, [scope, filter, searchIndex, dispatch])

  // <<= QUERY/RESULT


  // =>> SELECTION
  // Sync global selection with list state and vice versa.

  React.useEffect(() => {
    const handler = () => dispatch({ type: 'selection', selected: selection.selected() })
    selection.on('selection', handler)
    return () => selection.off('selection', handler)
  }, [selection, dispatch])

  React.useEffect(() => {
    selection.set(state.selected)
  }, [selection, state.selected])

  // <<= SELECTION

  /* eslint-disable react/prop-types */

  const child = React.useMemo(() => props => <IndexEntry
    key={props.id}
    ref={props.ref}
    id={props.id}
    entry={props.entry}
    selected={props.selected}
    editing={props.editing}
    dispatch={dispatch}
  />, [dispatch])

  const emptyList = () => {
    return (
      <div style={{ padding: '3px 6px' }}>
        <Card id='null:'>
          <span style={{ paddingTop: '6px' }} className='card-title'>No match</span>
        </Card>
      </div>
    )
  }

  /* eslint-enable react/prop-types */

  return (
    state.entries.length > 0
      ? <VirtualizedList child={child} { ...state }/>
      : emptyList()
  )
}

IndexBackedList.whyDidYouRender = true

IndexBackedList.propTypes = {
  scope: PropTypes.string.isRequired,
  filter: PropTypes.string.isRequired,
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
}

const IndexBackedListMemo = React.memo(IndexBackedList)
IndexBackedListMemo.whyDidYouRender = true

export { IndexBackedListMemo as IndexBackedList }
