import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { TagIcon } from './TagIcon'
import { cmdOrCtrl } from '../platform'
import { useServices } from './hooks'
import { matcher, stopPropagation } from './events'

/**
 * A tag in different variants.
 */
export const Tag = props => {
  const { store, controller } = useServices()
  const { id, spec } = props
  const [variant, label, action, path] = spec.split(':')
  const closable = variant === 'USER'
  const [mode, setMode] = React.useState('display')
  const [inputValue, setInputValue] = React.useState('')

  const handleClick = event => {
    event.stopPropagation()
    if (variant === 'PLUS') {
      setInputValue('')
      setMode('edit')
    } else {
      controller.onClick(id, event, spec)
    }
  }

  const handleMouseDown = event => controller.onMouseDown(id, event, spec)
  const handleMouseUp = event => controller.onMouseUp(id, event, spec)
  const addTag = value => store.addTag(id, value.toLowerCase())

  const commitValue = () => {
    setMode('display')
    if (inputValue) addTag(inputValue)
  }

  const handleBlur = commitValue

  const handleKeyDown = event => {
    matcher([
      ({ key }) => key === 'Enter',
      ({ key }) => key === 'Escape',
      ({ key }) => key === ' ',
      event => cmdOrCtrl(event) && event.key === 'a'
    ], stopPropagation)(event)

    switch (event.key) {
      case 'Enter': return commitValue()
      case 'Escape': return setMode('display')
    }
  }

  const handleChange = ({ target }) => {
    const value = target.value
      ? target.value.replace(/[^0-9a-z/]+/ig, '')
      : ''
    setInputValue(value.substring(0, 16).toUpperCase())
  }

  const handleClose = React.useCallback(() => {
    store.removeTag(id, label)
  }, [id, label, store])

  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = action !== 'NONE'
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  const closeIcon = closable &&
    <TagIcon
      path={mdi.mdiClose}
      closable={variant === 'USER'}
      color='grey'
      onClose={handleClose}
    />

  return mode === 'display'
    ? <span
        className={className}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        { variant === 'PLUS' && <TagIcon path={mdi.mdiPlus} size='12px'/>}
        {
          variant === 'PLUS'
            ? 'add tag'
            : path
              ? <TagIcon path={mdi[path]} size='12px'/>
              : label
        }
        { closeIcon }
      </span>
    : <input
        className='tag-input'
        value={inputValue}
        autoFocus
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
      >
      </input>
}

Tag.propTypes = {
  id: PropTypes.string.isRequired,
  spec: PropTypes.string.isRequired
}
