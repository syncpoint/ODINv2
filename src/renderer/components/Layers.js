import * as R from 'ramda'
import React from 'react'
import { FilterInput, IndexBackedList, History } from '.'
import { useList, useStack } from './hooks'
import { cmdOrCtrl } from '../platform'
import { isLayerId, isFeatureId } from '../ids'

const stickyHistoryEntry = {
  key: 'layer',
  scope: '@id:layer',
  label: 'Layers',
  items: [
    { key: 'layer', scope: '@id:layer', label: 'Layers' },
    { key: 'feature', scope: '@id:feature', label: 'Features' },
    { key: 'link', scope: '@id:link', label: 'Links' },
    { key: 'view', scope: '@id:view', label: 'Views' },
    { key: 'pinned', scope: '#pin', label: 'Pinned' }
  ]
}

/**
 * Top-most component, combining history. filter input and
 * concrete filterable list, e.g. feature list.
 * TODO: rename Marc -> ...
 */
const Marc = () => {
  const [listState, listDispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')
  const [historyEntries, historyDispatch] = useStack([stickyHistoryEntry])


  // Reset filter on each history update:
  React.useEffect(() => setFilter(''), [historyEntries])

  const handleKeyDown = event => {
    const preventDefault = R.cond([
      [({ key }) => key === 'ArrowDown', R.always(true)],
      [({ key }) => key === 'ArrowUp', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()

    if (cmdOrCtrl(event) && event.key === 'ArrowUp') {
      if (historyEntries.length > 1) historyDispatch({ type: 'pop' })
    }

    if (cmdOrCtrl(event) && event.key === 'ArrowDown') {
      if (!listState.focusId) return
      if (isLayerId(listState.focusId)) {
        historyDispatch({
          type: 'push',
          entry: {
            key: listState.focusId,
            scope: `@id:feature:${listState.focusId.split(':')[1]}`,
            label: listState.entries[listState.focusIndex].title
          }
        })
      } else if (isFeatureId(listState.focusId)) {
        historyDispatch({
          type: 'push',
          entry: {
            key: listState.focusId,
            scope: `@id:link @ref:${listState.focusId}`,
            label: listState.entries[listState.focusIndex].title
          }
        })
      }
    }

    const { key, shiftKey, metaKey, ctrlKey } = event
    listDispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  const handleFilterChange = React.useCallback(value => setFilter(value), [])

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
      <History entries={historyEntries} dispatch={historyDispatch}/>
      <div style={{ display: 'flex', padding: '8px' }}>
        <FilterInput size='large' value={filter} onChange={handleFilterChange}/>
      </div>
      <IndexBackedList
        scope={R.last(historyEntries).scope}
        history={history}
        filter={filter}
        dispatch={listDispatch}
        state={listState}
      />
    </div>
  )
}

Marc.whyDidYouRender = true

/**
 * Prevent Marc from re-rendering when Workspace updated
 * one if Marcs siblings (e.g. command palette).
 */
const MarcMemo = React.memo(Marc)
MarcMemo.whyDidYouRender = true

export { MarcMemo as Layers }
