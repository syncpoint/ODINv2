import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import { FilterInput, IndexBackedList, History } from '.'
import { useList, useStack, useServices } from './hooks'
import { cmdOrCtrl } from '../platform'
import { isLayerId, isFeatureId } from '../ids'
import { matcher, preventDefault } from './events'
import { Entries } from './selection'

/**
 * Top-most component, combining history, filter input and
 * concrete filterable list, e.g. feature list.
 */
const Sidebar = props => {
  const { selection } = useServices()
  const [listState, listDispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')
  const [historyEntries, historyDispatch] = useStack([props.group])
  const ref = React.useRef()

  // Reset filter on each history update:
  React.useEffect(() => setFilter(''), [historyEntries])

  React.useEffect(() => {
    historyDispatch({ type: 'reset', entry: props.group })
  }, [props.group, historyDispatch])

  // Focus sidebar AFTER edit:
  React.useEffect(() => {
    if (!listState.editId) ref.current.focus()
  }, [listState.editId])

  const handleClick = () => selection.set([])

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp'
    ], preventDefault)(event)

    // History: Back.
    if (cmdOrCtrl(event) && event.key === 'ArrowUp') {
      if (historyEntries.length > 1) historyDispatch({ type: 'pop' })
    }

    // History: Open details.
    if (cmdOrCtrl(event) && event.key === 'ArrowDown') {
      if (listState.selected.length !== 1) return

      const focusId = listState.selected[listState.selected.length - 1]
      const focusIndex = Entries.focusIndex(listState)

      if (isLayerId(focusId)) {
        const layerId = focusId.split(':')[1]

        historyDispatch({
          type: 'push',
          entry: {
            key: focusId,
            // scope: `@id:feature:${layerId}|link+layer:${layerId}`,
            scope: `@feature @link !feature:${layerId} !link+layer:${layerId}`,
            label: listState.entries[focusIndex].title || 'N/A'
          }
        })
      } else if (isFeatureId(focusId)) {
        historyDispatch({
          type: 'push',
          entry: {
            key: focusId,
            scope: `@link !link+feature:${focusId.split(':')[1]}`,
            label: listState.entries[focusIndex].title || 'N/A'
          }
        })
      }
    }

    const { key, shiftKey, metaKey, ctrlKey } = event
    listDispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  // Reset ongoing editing if anything (i.e. card title) lost focus.
  const handleBlur = event => {
    if (event.target === ref.current) return
    listDispatch({ type: 'blur' })
  }

  const handleFilterChange = React.useCallback(value => setFilter(value), [])

  return (
    <div
      ref={ref}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <History entries={historyEntries} dispatch={historyDispatch}/>
      <div style={{ display: 'flex', padding: '0.5em' }}>
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

Sidebar.propTypes = {
  group: PropTypes.object.isRequired
}

Sidebar.whyDidYouRender = true

const SidebarMemo = React.memo(Sidebar)
SidebarMemo.whyDidYouRender = true
export { SidebarMemo as Sidebar }
