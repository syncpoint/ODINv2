/* eslint-disable react/prop-types */
import React from 'react'
import { TAG } from './tags'
import { Title } from './Title'


/**
 *
 */
export const Card = React.forwardRef((props, ref) => {
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
        <div className='e3de-taglist'>
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
export const MemoizedCard = React.memo(Card)
MemoizedCard.whyDidYouRender = true
