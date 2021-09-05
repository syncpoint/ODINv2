import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'
import { List, IndexEntry } from '.'


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

  const handleSelection = React.useCallback(event => {
    dispatch({ type: 'selection', event })
  }, [dispatch])

  React.useEffect(() => {
    selection.on('selection', handleSelection)
    return () => selection.off('selection', handleSelection)
  }, [selection, handleSelection])

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
    focused={props.focused}
    selected={props.selected}
    dispatch={dispatch}
  />, [dispatch])

  /* eslint-enable react/prop-types */

  return (
    state.entries.length > 0
      ? <List child={child} { ...state }/>
      : null
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
