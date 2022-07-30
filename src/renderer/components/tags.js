/* eslint-disable react/prop-types */
import React from 'react'
import * as mdi from '@mdi/js'
import { TagIcon } from './TagIcon'

/**
 *
 */
export const ScopeTag = props => {
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
export const SystemTag = props => {
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
export const UserTag = props => {
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
export const PlusTag = props => {
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
export const TAG = {
  SCOPE: props => <ScopeTag {...props}/>,
  SYSTEM: props => <SystemTag {...props}/>,
  USER: props => <UserTag {...props}/>,
  PLUS: props => <PlusTag {...props}/>
}
