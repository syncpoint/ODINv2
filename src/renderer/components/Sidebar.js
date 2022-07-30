/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import { Disposable } from '../../shared/disposable'
import { useMemento, useList, useServices } from './hooks'
import { History } from './History'
import { FilterInput } from './FilterInput'
import { MemoizedCard } from './BetterCard'
import { EntryList } from './EntryList'
import { matcher, preventDefault } from './events'
import { cmdOrCtrl } from '../platform'
import * as ID from '../ids'
import './Sidebar.scss'


/**
 * One model to rule 'em all...
 * This hooks is an extreme experiment.
 * All sidebar state is managed here, specifically
 *
 *  . list model (entries, selection, focus)
 *  . card title editing state (excluding current value)
 *  . parent/child navigation history aka breadcrumbs
 *  . search scope (incl. persistence)
 *  . search filter (incl. persistence)
 *
 * Some code can and probably should be moved to some
 * more private parts (no pun intended) of the application.
 * Potential sections are marked with TODO: push down ...
 *
 * It is debatable whether low-level services such as
 * store, emitter and ipcRenderer should be hidden behind
 * controllers or similar.
 */
const useModel = () => {
  const { searchIndex, selection, store, emitter, ipcRenderer } = useServices()
  const defaultHistory = [{ key: 'root', scope: '@layer', label: 'Layer' }]
  const [history, setHistory] = useMemento('ui.sidebar.history', defaultHistory)
  const [filter, setFilter] = useMemento('ui.sidebar.filter', '')
  const [list, dispatch] = useList({ multiselect: true })
  const [editing, setEditing] = React.useState(false) // false || entry id
  const sidebar = React.useRef()

  // >>= QUERY/RESULT
  // Open new query, dispatch result list and listen for
  // changes on query result list due to search index updates.

  React.useEffect(() => {
    if (history === null) return
    if (filter === null) return

    const terms = `${R.last(history).scope} ${filter}`
    const disposable = searchIndex.query(terms, entries => {
      // Note: (multiselect) strategy makes sure that state is only
      // updated when entries are not deep equal.
      dispatch({ type: 'entries', entries })
    })

    return async () => (await disposable).dispose()
  }, [history, filter, searchIndex, dispatch])

  // <<= QUERY/RESULT

  // =>> SELECTION
  // Sync global selection with list state and vice versa.

  React.useEffect(() => {
    const selectionEvent = () => ({ type: 'selection', selected: selection.selected() })
    const disposable = Disposable.of()
    disposable.on(selection, 'selection', () => dispatch(selectionEvent()))
    return () => disposable.dispose()
  }, [selection, dispatch])

  React.useEffect(() => {
    selection.set(list.selected)
  }, [selection, list.selected])

  // <<= SELECTION

  // Focus sidebar after edit to keep on getting key events.
  //
  React.useEffect(() => {
    if (!sidebar.current) return
    if (!editing) sidebar.current.focus()
  }, [editing])

  // Reset filter on each history update:
  React.useEffect(() => {
    setFilter('')
  }, [history, setFilter])


  const addTag = React.useCallback((id, value) => {
    store.addTag(id, value.toLowerCase())
    if (sidebar.current) sidebar.current.focus()
  }, [store])

  const removeTag = React.useCallback((id, value) => store.removeTag(id, value.toLowerCase()), [store])
  const onFilterChange = React.useCallback(value => setFilter(value), [setFilter])
  const onEntryClick = React.useCallback((id, { metaKey, ctrlKey, shiftKey }) => dispatch({ type: 'click', id, metaKey, ctrlKey, shiftKey }), [dispatch])

  const onEntryDoubleClick = React.useCallback(id => {
    // TODO: push down (LinkController)
    const scope = ID.scope(id)
    const handlers = {
      symbol: id => emitter.emit('command/entry/draw', { id }),
      'link+layer': async id => (await store.values([id])).forEach(link => ipcRenderer.send('OPEN_LINK', link)),
      'link+feature': async id => (await store.values([id])).forEach(link => ipcRenderer.send('OPEN_LINK', link)),
      marker: async id => {
        const markers = await store.values([id])
        if (markers.length !== 1) return
        const center = markers[0].geometry.coordinates
        emitter.emit('map/flyto', { center })
      }
    }

    const handler = handlers[scope] || (() => {})
    handler(id)
  }, [emitter, store, ipcRenderer])

  // Handle actionable tags (ide, show, etc.)
  //
  const onTagClick = React.useCallback((id, event, spec) => {
    // TODO: push down (TagStore or FlagStore)
    const ids = R.uniq([id, ...selection.selected()])
    if (spec.match(/SYSTEM:HIDDEN/)) store.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) store.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) store.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) store.lock(ids)
  }, [selection, store])

  // Handle scope tag (identify/highlight).
  //
  const onTagMouseDown = React.useCallback((id, event, spec) => {
    // TODO: push down (HighlightController)
    const ids = R.uniq([id, ...selection.selected()])
    if (spec.match(/SCOPE:FEATURE/)) emitter.emit('highlight/on', { ids })
    if (spec.match(/SCOPE:LAYER/)) emitter.emit('highlight/on', { ids })
    if (spec.match(/SCOPE:MARKER/)) emitter.emit('highlight/on', { ids })
  }, [emitter, selection])

  const onTagMouseUp = React.useCallback((id, event, spec) => {
    // TODO: push down (HighlightController)
    if (spec.match(/SCOPE:FEATURE/)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:LAYER/)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:MARKER/)) emitter.emit('highlight/off')
  }, [emitter])

  const onKeyDown = React.useCallback(event => {
    matcher([
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp'
    ], preventDefault)(event)

    const { key, shiftKey, metaKey, ctrlKey } = event

    if (cmdOrCtrl(event)) {
      if (event.key === 'ArrowUp' && history.length > 1) {
        setHistory(R.dropLast(1, history))
      } else if (event.key === 'ArrowDown' && list.focusIndex !== -1) {
        const focusId = R.last(list.selected)
        const label = list.entries[list.focusIndex].title || 'N/A'

        if (ID.isLayerId(focusId)) {
          const layerId = focusId.split(':')[1]
          setHistory([...history, {
            scope: `@feature @link !feature:${layerId} !link+layer:${layerId}`,
            key: focusId,
            label
          }])
        } else if (ID.isFeatureId(focusId)) {
          setHistory([...history, {
            scope: `@link !link+feature:${focusId.split(':')[1]}`,
            key: focusId,
            label
          }])
        }
      }
    }

    // Handle event relevant for editing first.
    // TODO: push down (useInlineEditor())
    if (key === 'Escape' && editing) {
      setEditing(false)
      event.stopPropagation()
    } else if (key === 'F2' && !editing && list.selected.length) {
      setEditing(R.last(list.selected))
      event.stopPropagation()
    } else if (key === 'Enter' && editing) {
      setEditing(false)
      event.stopPropagation()
    } else if (key === 'Enter' && !editing) {
      setEditing(R.last(list.selected))
      event.stopPropagation()
    }

    // TODO: handle parent/child navigation

    // If still permitted, propagate to list state reducer.
    //
    if (!event.isPropagationStopped()) {
      dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
    }
  }, [dispatch, editing, list.selected, history, setHistory, list.entries, list.focusIndex])

  const onTitleChange = React.useCallback((id, value) => {
    store.rename(id, value)
  }, [store])

  // Reset selection.
  //
  const onClick = React.useCallback(() => selection.set([]), [selection])

  const onDrop = React.useCallback(async (id, event) => {

    // TODO: push down (DragAndDropAdapter/Controller or LinkStore)

    // Process files first (if any):
    const [...files] = event.dataTransfer.files
    const fileLinks = files.reduce((acc, file) => {
      const url = new URL(`file:${file.path}`)
      const value = { name: file.name, url: url.href }
      acc.push([ID.linkId(id), value])
      return acc
    }, [])

    // Append possible items to existing file links:
    const getAsString = item => new Promise(resolve => item.getAsString(resolve))
    const [...items] = event.dataTransfer.items

    const links = items
      .filter(item => item.type === 'text/uri-list')
      .reduce(async (acc, item) => {
        const arg = await getAsString(item)

        const url = new URL(arg)
        if (!url.hostname || !url.href) return acc

        const value = { name: url.origin, url: url.href }
        const links = await acc
        links.push([ID.linkId(id), value])
        return links
      }, fileLinks)

    store.insert(await links)
  }, [store])

  return {
    state: { history, filter, editing, ...list },
    refs: { sidebar },
    setHistory,
    addTag,
    removeTag,
    onTagClick,
    onTagMouseDown,
    onTagMouseUp,
    onTitleChange,
    onFilterChange,
    onEntryClick,
    onEntryDoubleClick,
    onKeyDown,
    onClick,
    onDrop
  }
}


/**
 *
 */
export const Sidebar = () => {
  const { state, refs, ...controller } = useModel()

  const renderEntry = React.useCallback(({ index, measureRef }) => {
    // Handle 'overshooting':
    if (index >= state.entries.length) return null
    const entry = state.entries[index]

    return (
      <MemoizedCard
        key={entry.id}
        {...entry}
        ref={measureRef}
        selected={state.selected.includes(entry.id)}
        editing={state.editing}
        addTag={controller.addTag}
        removeTag={controller.removeTag}
        onTagClick={controller.onTagClick}
        onTagMouseDown={controller.onTagMouseDown}
        onTagMouseUp={controller.onTagMouseUp}
        onEntryClick={controller.onEntryClick}
        onEntryDoubleClick={controller.onEntryDoubleClick}
        onTitleChange={controller.onTitleChange}
        onDrop={controller.onDrop}
      />
    )
  }, [state, controller])

  if (state.scope === null) return null
  if (state.filter === null) return null

  return (
    <div className="e3de-sidebar"
      ref={refs.sidebar}
      tabIndex={0}
      onKeyDown={controller.onKeyDown}
      onClick={controller.onClick}
    >
      <History
        history={state.history}
        setHistory={controller.setHistory}
      />
      <FilterInput value={state.filter} onChange={controller.onFilterChange}/>
      <EntryList
        count={state.entries.length}
        scroll={state.scroll}
        focusIndex={state.focusIndex}
        renderEntry={renderEntry}
      />
    </div>
  )
}

Sidebar.whyDidYouRender = true
