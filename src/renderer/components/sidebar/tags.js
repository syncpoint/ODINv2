/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import * as mdi from '@mdi/js'
import { useServices } from '../hooks'
import { TagIcon } from './TagIcon'
import { matcher, stopPropagation } from '../events'
import { cmdOrCtrl } from '../../platform'


/**
 *
 */
const useController = () => {
  const { emitter, selection, store } = useServices()

  // Handle scope tag (identify/highlight).
  //
  const handleMouseDown = (id, event, spec) => {
    const ids = R.uniq([id, ...selection.selected()])
    if (spec.match(/SCOPE:FEATURE/)) emitter.emit('highlight/on', { ids })
    if (spec.match(/SCOPE:LAYER/)) emitter.emit('highlight/on', { ids })
    if (spec.match(/SCOPE:MARKER/)) emitter.emit('highlight/on', { ids })
    if (spec.match(/SCOPE:PLACE/)) emitter.emit('highlight/on', { ids })
  }

  const handleMouseUp = (id, event, spec) => {
    // TODO: push down (HighlightController)
    if (spec.match(/SCOPE:FEATURE/)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:LAYER/)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:MARKER/)) emitter.emit('highlight/off')
    else if (spec.match(/SCOPE:PLACE/)) emitter.emit('highlight/off')
  }

  const handleClick = (id, event, spec) => {
    // TODO: push down (TagStore or FlagStore)
    const ids = R.uniq([id, ...selection.selected()])
    if (spec.match(/SYSTEM:HIDDEN/)) store.show(ids)
    else if (spec.match(/SYSTEM:VISIBLE/)) store.hide(ids)
    else if (spec.match(/SYSTEM:LOCKED/)) store.unlock(ids)
    else if (spec.match(/SYSTEM:UNLOCKED/)) store.lock(ids)
  }

  const addTag = (id, value) => store.addTag(id, value.toLowerCase())
  const removeTag = (id, value) => store.removeTag(id, value.toLowerCase())

  return {
    handleMouseDown,
    handleMouseUp,
    handleClick,
    addTag,
    removeTag
  }
}


/**
 *
 */
export const ScopeTag = props => {
  const controller = useController()
  const { id, spec, label, action } = props
  const active = action !== 'NONE' ? '--active' : ''
  const className = `e3de-tag e3de-tag--scope e3de-tag${active}`

  // Don't mess with card selection.
  const handleClick = event => event.stopPropagation()

  return (
    <span
      className={className}
      onClick={handleClick}
      onMouseDown={event => controller.handleMouseDown(id, event, spec)}
      onMouseUp={event => controller.handleMouseUp(id, event, spec)}
    >
      {label}
    </span>
  )
}


/**
 *
 */
export const SystemTag = props => {
  const controller = useController()

  const handleClick = event => {
    event.stopPropagation()
    controller.handleClick(props.id, event, props.spec)
  }

  const active = props.action !== 'NONE' ? '--active' : ''
  const className = `e3de-tag e3de-tag--system e3de-tag${active}`

  return (
    <span
      className={className}
      onClick={handleClick}
    >
      {props.label.replace(/[_]/g, ' ')}
    </span>
  )
}


/**
 *
 */
export const UserTag = props => {
  const controller = useController()
  const { id, label } = props

  const handleRemove = () => controller.removeTag(id, label)

  return (
    <span className={'e3de-tag e3de-tag--user e3de-tag'}>
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
export const PlusTag = props => {
  const controller = useController()
  const [mode, setMode] = React.useState('display')
  const [inputValue, setInputValue] = React.useState('')

  const handleEnter = () => {
    // Pre-emptively focus sidebar to keep getting key events.
    // Note: This also keeps focus on sidebar when tab is pressed while editing.
    document.getElementsByClassName('e3de-sidebar')[0].focus()

    setMode('display')
    if (inputValue) controller.addTag(props.id, inputValue)
  }

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'Enter',
      ({ key }) => key === 'Escape',
      ({ key }) => key === 'ArrowDown',
      ({ key }) => key === 'ArrowUp',
      ({ key }) => key === 'Home',
      ({ key }) => key === 'End',
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
      className='e3de-tag e3de-tag--plus'
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
 * Different tag flavor.
 */
export const TAG = {
  SCOPE: props => <ScopeTag {...props}/>,
  SYSTEM: props => <SystemTag {...props}/>,
  USER: props => <UserTag {...props}/>,
  PLUS: props => <PlusTag {...props}/>
}
