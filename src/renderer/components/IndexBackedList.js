import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from './services'
import { List, Card, Avatar, TagList } from '.'

/**
 *
 */
const IndexBackedList = props => {
  const { searchIndex, propertiesStore, selection } = useServices()
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

  const handleAddTag = React.useCallback((id, name) => propertiesStore.addTag(id, name), [propertiesStore])
  const handleRemoveTag = React.useCallback((id, name) => propertiesStore.removeTag(id, name), [propertiesStore])
  const handleRename = React.useCallback((id, value) => propertiesStore.rename(id, value), [propertiesStore])

  /* eslint-disable react/prop-types */

  // WDYR does not flag child function without useCallback().
  // But why not use it anyways...
  const child = React.useCallback(props => {
    const { entry } = props
    const handleClick = id => ({ metaKey, shiftKey }) => dispatch({ type: 'click', id, shiftKey, metaKey })

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
            <Card.Title
              id={props.id}
              value={entry.title}
              onChange={handleRename}
            />
            <Card.Description value={entry.description}/>
          </Card.Content>
          { (entry.url || entry.path) && <Avatar url={entry.url} path={entry.path}/> }
        </div>

        <TagList
          id={props.id}
          tags={entry.tags}
          capabilities={entry.capabilities}
          onAdd={handleAddTag}
          onRemove={handleRemoveTag}
        />
      </Card>
    )
  }, [dispatch, handleAddTag, handleRemoveTag, handleRename])

  /* eslint-enable react/prop-types */

  return (
    <List child={child} { ...state }/>
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
