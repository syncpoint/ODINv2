import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { Input } from 'antd'
import { Card, Avatar } from '.'
import { useList, useDebounce } from './hooks'
import { useServices } from './services'
import { cmdOrCtrl } from '../platform'
import { MemoizedTagIcon } from './TagIcon'


/**
 * Input component with debounced value.
 */
const FilterInput = props => {
  const { onChange } = props

  /**
   * value :: string
   * Value (not debounced) is managed because it
   *  1. might be supplied through props.value
   *  2. can actively reset by hitting escape key
   */
  const [value, setValue] = React.useState(props.value || '')
  const debouncedValue = useDebounce(value, 50)

  // Pass debounced value to parent:
  React.useEffect(() => {
    onChange && onChange(debouncedValue)
  }, [onChange, debouncedValue])

  const handleChange = ({ target }) => setValue(target.value)

  const handleKeyDown = event => {
    const preventDefault = R.cond([
      [({ key }) => key === 'Home', R.always(true)],
      [({ key }) => key === 'End', R.always(true)],
      [R.T, R.always(false)]
    ])

    const stopPropagation = R.cond([
      [({ key }) => key === 'Escape', R.always(true)],
      [event => cmdOrCtrl(event) && event.key === 'a', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()
    if (stopPropagation(event)) event.stopPropagation()
    if (event.key === 'Escape') setValue('')
  }

  return <Input
    autoFocus
    allowClear
    value={value}
    placeholder={props.placeholder}
    size={props.size || 'default'}
    onChange={handleChange}
    onKeyDown={handleKeyDown}
  />
}

FilterInput.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  onChange: PropTypes.func
}

FilterInput.whyDidYouRender = true

/**
 * Memoized version prevents re-render on same props.
 * This will be caused by parent, when one or more siblings must
 * be rendered, but props for this component remain unchanged.
 */
const FilterInputMemo = React.memo(FilterInput)
FilterInputMemo.whyDidYouRender = true


/**
 * A tag in different variants.
 */
const Tag = props => {
  const { variant, children } = props
  const closable = variant === 'USER'

  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = props.action !== 'NONE'
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  const handleClose = () => props.onClose && props.onClose()
  const handleClick = event => {
    event.stopPropagation()
    props.onClick && props.onClick(event)
  }

  return (
    <span
      className={className}
      onClick={handleClick}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
    >
      { children }
      {
        closable &&
        props.capabilities.includes('TAG') &&
        <MemoizedTagIcon
          path={mdi.mdiClose}
          closable={closable}
          onClose={handleClose}
          color='grey'
        />
      }
    </span>
  )
}

Tag.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  action: PropTypes.string,
  capabilities: PropTypes.string,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onClose: PropTypes.func
}


/**
 * List of tags with optional slot to create a new tag.
 */
const TagList = props => {
  const { id, tags } = props
  const [inputVisible, setInputVisible] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.createRef()

  const handleClose = tag => () => props.onRemove && props.onRemove(id, tag)
  const handleChange = ({ target }) => setInputValue(target.value)

  const handleClick = event => {
    setInputValue('')
    setInputVisible(true)

    // Don't let bubble up and interfere with current selection.
    event.stopPropagation()
  }

  const handleBlur = () => {
    setInputVisible(false)
    if (!inputValue) return
    props.onAdd && props.onAdd(id, inputValue.toLowerCase())
  }

  const handleKeyDown = event => {
    const stopPropagation = R.cond([
      [({ key }) => key === 'Enter', R.always(true)],
      [({ key }) => key === 'Escape', R.always(true)],
      [event => cmdOrCtrl(event) && event.key === 'a', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (stopPropagation(event)) event.stopPropagation()

    switch (event.key) {
      case 'Enter': return handleBlur()
      case 'Escape': return setInputVisible(false)
    }
  }

  const tag = spec => {
    const [variant, label, action, path] = spec.split(':')

    return (
      <Tag
        key={`${variant}:${label}`}
        id={id}
        variant={variant}
        action={action}
        onClose={handleClose(label)}
        capabilities={props.capabilities}
      >
        {
          variant !== 'IMAGE'
            ? <span>{label}</span>
            : <MemoizedTagIcon path={mdi[path]} color='black' size='12px'/>
        }
      </Tag>
    )
  }

  const newTag = (props.capabilities || '').includes('TAG')
    ? inputVisible
      ? <input
          className='tag-input'
          ref={inputRef}
          autoFocus
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
        />
      : <Tag
          variant='plus'
          onClick={handleClick}
          color='black'
        >
          <MemoizedTagIcon path={mdi.mdiPlus} size='12px'/>
          <span>ADD TAG</span>
        </Tag>
    : null


  return (
    <div className='tag-list'>
      { (tags || '').split(' ').map(tag) }
      { newTag }
    </div>
  )
}


TagList.propTypes = {
  id: PropTypes.string.isRequired,
  tags: PropTypes.string.isRequired,
  capabilities: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func
}


TagList.whyDidYouRender = true

/**
 * Thea is sibling to card content with card as parent.
 * whenever card content or its parent renders, Thea has to
 * follow suit, often with unchanged props. Hence PureThea
 * to the rescue.
 */
const TagListMemo = React.memo(TagList)
TagListMemo.whyDidYouRender = true



/**
 *
 */
const IndexBackedList = props => {
  const { searchIndex, propertiesStore, selection } = useServices()
  const { scope, filter, dispatch, state } = props

  React.useEffect(() => {
    const pendingQuery = (async () => {
      return await searchIndex.query(`@${scope} ${filter}`, entries => {
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


  const handleAddTag = React.useCallback(
    (id, name) => propertiesStore.addTag(id, name),
    [propertiesStore]
  )

  const handleRemoveTag = React.useCallback(
    (id, name) => propertiesStore.removeTag(id, name),
    [propertiesStore]
  )

  /* eslint-disable react/prop-types */

  // WDYR does not flag child function without useCallback().
  // But why not use it anyways...
  const child = React.useCallback(props => {
    const { entry } = props
    const handleClick = id => ({ metaKey, shiftKey }) => dispatch({ type: 'click', id, shiftKey, metaKey })
    const handleRename = id => value => propertiesStore.rename(id, value)

    // There must be some difference between 'handleRename' and these
    // two guys. (Pure)Thea is re-renderd because 'different functions with the same name'.
    // Hence the two equally named callbacks above.
    // const handleAddTag = id => name => propertiesStore.addTag(id, name)
    // const handleRemoveTag = id => name => propertiesStore.removeTag(id, name)

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
              value={entry.title}
              onChange={handleRename(props.id)}
            />
            <Card.Description value={entry.description}/>
          </Card.Content>
          { (entry.url || entry.path) && <Avatar url={entry.url} path={entry.path}/> }
        </div>

        <TagListMemo
          id={props.id}
          tags={entry.tags}
          capabilities={entry.capabilities}
          onAdd={handleAddTag}
          onRemove={handleRemoveTag}
        />
      </Card>
    )
  }, [dispatch, propertiesStore, handleAddTag, handleRemoveTag])

  /* eslint-enable react/prop-types */

  return (
    <ListMemo child={child} { ...state }/>
  )
}

IndexBackedList.whyDidYouRender = true

IndexBackedList.propTypes = {
  scope: PropTypes.string.isRequired,
  filter: PropTypes.string.isRequired,
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
}



/**
 * Abstract list. Mainly obsessed with scrolling.
 */
const List = props => {
  const { child, focusId, selected } = props
  const cardrefs = props.entries.map(_ => React.createRef())

  const scrollIntoView = (refs, index, behavior) =>
    refs[index] &&
    refs[index].current &&
    refs[index].current.scrollIntoView({
      behavior,
      block: 'nearest'
    })

  React.useEffect(() => {
    if (props.scroll === 'none') return
    scrollIntoView(cardrefs, props.focusIndex, props.scroll)
  }, [cardrefs, props.focusIndex, props.scroll])

  const handleKeyDown = event => {
    const { key } = event
    if (key === ' ') event.preventDefault()
  }

  const card = (entry, index) => {
    return child({
      entry,
      id: entry.id,
      focused: focusId === entry.id,
      selected: selected.includes(entry.id),
      ref: cardrefs[index]
    })
  }

  const list = props.entries.length
    ? props.entries.map(card)
    : null

  return (
    <div className='list-container'>
      <div
        className='list'
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        { list }
      </div>
    </div>
  )
}

List.propTypes = {
  entries: PropTypes.array.isRequired,
  focusId: PropTypes.string,
  focusIndex: PropTypes.number.isRequired,
  selected: PropTypes.array.isRequired,
  scroll: PropTypes.string,
  child: PropTypes.func.isRequired
}

List.whyDidYouRender = true

const ListMemo = React.memo(List)
ListMemo.whyDidYouRender = true

/* eslint-disable react/prop-types */

/**
 * Top-most component, combining filter input and
 * concrete filterable list, e.g. feature list.
 */
const Marc = () => {
  const [state, dispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')

  const handleKeyDown = event => {
    // console.log('<Marc/> handleKeyDown', event)

    const preventDefault = R.cond([
      [({ key }) => key === 'ArrowDown', R.always(true)],
      [({ key }) => key === 'ArrowUp', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()

    const { key, shiftKey, metaKey, ctrlKey } = event
    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
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
      <div style={{ display: 'flex', padding: '6px' }}>
        <FilterInputMemo size='large' onChange={handleFilterChange}/>
      </div>
      <IndexBackedList scope='feature' filter={filter} dispatch={dispatch} state={state}/>
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
