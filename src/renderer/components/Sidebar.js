/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import useVirtual from 'react-cool-virtual'
import { Disposable } from '../../shared/disposable'
import { useMemento, useList, useServices } from './hooks'
import { History } from './History'
import { FilterInput } from './FilterInput'
import { matcher, stopPropagation, preventDefault } from './events'
import { cmdOrCtrl } from '../platform'
import * as ID from '../ids'
import './Sidebar.scss'


/**
 *
 */
const TagIcon = props => {
  const { path, removable, color } = props

  const handleClick = event => {
    event.stopPropagation()
    props.onClick && props.onClick()
  }

  const className = removable
    ? 'e3de-tag-icon e3de-tag-close-icon'
    : 'e3de-tag-icon'

  return (
    <span className={className} onClick={handleClick}>
      <Icon path={path} size='12px' color={color}/>
    </span>
  )
}


/**
 *
 */
const ScopeTag = props => {
  const { id, spec, label, action } = props

  // TODO: handle click
  const handleClick = () => {}

  const active = action !== 'NONE' ? '--active' : ''
  const className = `e3de-tag--scope e3de-tag${active}`

  return (
    <span
      className={className}
      onClick={handleClick}
      onMouseDown={event => props.onTagMouseDown(id, event, spec)}
      onMouseUp={event => props.onTagMouseUp(id, event, spec)}
    >
      {label}
    </span>
  )
}


/**
 *
 */
const SystemTag = props => {
  const handleClick = event => {
    event.stopPropagation()
    props.onTagClick(props.id, event, props.spec)
  }

  const active = props.action !== 'NONE' ? '--active' : ''
  const className = `e3de-tag--system e3de-tag${active}`

  return (
    <span
      className={className}
      onClick={handleClick}
    >
      {props.label}
    </span>
  )
}


/**
 *
 */
const UserTag = props => {
  const { id, label } = props

  const handleRemove = () => props.removeTag(id, label)

  return (
    <span className={'e3de-tag--user e3de-tag'}>
      {label}
      <TagIcon
        path={mdi.mdiClose}
        removable={true}
        color='grey'
        onClick={handleRemove}
      />
    </span>
  )
}


/**
 *
 */
const PlusTag = props => {
  const { id } = props
  const [mode, setMode] = React.useState('display')
  const [inputValue, setInputValue] = React.useState('')

  const handleEnter = () => {
    setMode('display')
    if (inputValue) props.addTag(id, inputValue)
  }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'Enter',
      ({ key }) => key === 'Escape',
      ({ key }) => key === ' ',
      event => cmdOrCtrl(event) && event.key === 'a'
    ], stopPropagation)(event)

    switch (event.key) {
      case 'Enter': return handleEnter()
      case 'Escape': return setMode('display')
    }
  }

  const handleChange = ({ target }) => {
    const value = target.value
      ? target.value.replace(/[^0-9a-z/]+/ig, '')
      : ''
    setInputValue(value.substring(0, 16).toUpperCase())
  }

  const handleClick = event => {
    event.stopPropagation()
    setInputValue('')
    setMode('edit')
  }

  const tag = () =>
    <span
      className='e3de-tag--plus e3de-tag'
      onClick={handleClick}
    >
      <TagIcon path={mdi.mdiPlus} size='12px'/>
      {'add tag'}
    </span>

  const input = () =>
    <input
      className='e3de-tag__input'
      value={inputValue}
      onBlur={handleEnter}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      autoFocus
    >
    </input>

  return mode === 'display' ? tag() : input()
}


/**
 * Different flavor of tags.
 */
const TAG = {
  SCOPE: props => <ScopeTag {...props}/>,
  SYSTEM: props => <SystemTag {...props}/>,
  USER: props => <UserTag {...props}/>,
  PLUS: props => <PlusTag {...props}/>
}


/**
 *
 */
const Title = props => {
  const [value, setValue] = React.useState(props.value)
  const inputRef = React.useRef()
  const placeholder = value
    ? null
    : props.editing
      ? null
      : 'N/A (click to edit)'


  React.useEffect(() => { setValue(props.value) }, [props.value])

  const rename = name => {
    if (props.value === name) return
    props.onTitleChange(props.editing, name.trim())
  }

  const reset = () => setValue(props.value)
  const handleChange = ({ target }) => setValue(target.value)

  const handleBlur = () => {
    if (!value) return
    rename(value)
  }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === ' ',
      event => event.key === 'a' && cmdOrCtrl(event)
    ], stopPropagation)(event)

    if (event.key === 'Escape') return reset()
    else if (event.key === 'Enter') return rename(value)
  }

  const input = () => <input
    className='e3de-card__title'
    ref={inputRef}
    autoFocus
    value={value || ''}
    placeholder={placeholder}
    onChange={handleChange}
    onBlur={handleBlur}
    onKeyDown={handleKeyDown}
  />

  const spanValue = props.editing
    ? value || ''
    : value || placeholder

  const spanStyle = placeholder
    ? { color: '#c0c0c0' }
    : {}

  const span = () =>
    <span
      style={spanStyle}
      className='e3de-card__title'
      placeholder={placeholder}
    >
      {spanValue}
    </span>

  return props.editing === props.id ? input() : span()
}


/**
 *
 */
const Card = React.forwardRef((props, ref) => {
  const [dropAllowed, setDropAllowed] = React.useState(null)

  const style = dropAllowed === true
    ? { borderStyle: 'dashed', borderColor: '#40a9ff' }
    : {}

  const acceptDrop = () => props.capabilities && props.capabilities.includes('DROP')

  const dropEffect = event => {
    const types = [...event.dataTransfer.types]
    return acceptDrop()
      ? types.some(t => t === 'text/uri-list') ? 'copy' : 'link'
      : 'none'
  }

  const handleDragOver = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
    setDropAllowed(acceptDrop())
  }

  const handleDragEnter = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
  }

  const handleDragLeave = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = dropEffect(event)
    setDropAllowed(null)
  }

  const handleDrop = event => {
    event.preventDefault()
    setDropAllowed(null)
    if (acceptDrop()) props.onDrop(props.id, event)
  }

  const tag = spec => {
    const [variant, label, action, path] = spec.split(':')
    return TAG[variant]({
      key: spec,
      id: props.id,
      spec,
      label,
      action,
      path,
      addTag: props.addTag,
      removeTag: props.removeTag,
      onTagClick: props.onTagClick,
      onTagMouseDown: props.onTagMouseDown,
      onTagMouseUp: props.onTagMouseUp
    })
  }

  const avatar = props.url &&
    <div className='avatar'>
      <img className='image' src={props.url}/>
    </div>

  const description = props.description &&
    <span className='e3de-description'>{props.description}</span>

  return (
    <div className='e3de-card-container' ref={ref}>
      <div
        className='e3de-card e3de-column'
        style={style}
        aria-selected={props.selected}
        onClick={event => props.onEntryClick(props.id, event)}
        onDoubleClick={event => props.onEntryDoubleClick(props.id, event)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className='header e3de-row'>
          <Title
            id={props.id}
            value={props.title}
            editing={props.editing}
            onTitleChange={props.onTitleChange}
          />
        </div>
        <div className='body e3de-row'>
          {description}
          { avatar }
        </div>
        <div className='taglist'>
          {
            props.tags.split(' ').map(spec => tag(spec))
          }
        </div>
      </div>
    </div>
  )
})

Card.displayName = 'Card'
Card.whyDidYouRender = true

/**
 * react-cool-virtual rerenders children quite often because of
 * seemingly insignificant changes in items array. To prevent
 * unnecesary Card rerenders, we shallow compare its props through
 * React.memo().
 */
const MemoizedCard = React.memo(Card)
MemoizedCard.whyDidYouRender = true


/**
 *
 */
const EntryList = props => {
  const { count, scroll, focusIndex } = props
  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: count,
    resetScroll: true
  })

  React.useEffect(() => {
    if (scroll === 'none') return
    if (focusIndex === undefined) return
    if (focusIndex === -1) return
    scrollToItem({ index: focusIndex, align: 'auto', smooth: false })
  }, [scrollToItem, focusIndex, scroll])

  return (
    <div className='e3de-list-container' ref={outerRef}>
      <div ref={innerRef}>
        { items.map(props.renderEntry) }
      </div>
    </div>
  )
}

EntryList.whyDidYouRender = true



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
      <div style={{ display: 'flex', padding: '0.5em' }}>
        <FilterInput value={state.filter} onChange={controller.onFilterChange}/>
      </div>
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
