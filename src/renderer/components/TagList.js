import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import Tag from './Tag'
import TagIcon from './TagIcon'

export const TagList = React.memo(props => {
  const { id, tags } = props
  const [inputVisible, setInputVisible] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.createRef()

  const handleClose = tag => () => props.onRemove && props.onRemove(tag)

  const handleClick = event => {

    // Don't let bubble up and interfere with current selection.
    event.stopPropagation()

    setInputValue('')
    setInputVisible(true)
  }

  const handleBlur = () => {
    setInputVisible(false)
    if (!inputValue) return
    props.onAdd && props.onAdd(inputValue.toLowerCase())
  }

  const handleKeyDown = event => {
    switch (event.key) {
      case 'Enter': {
        event.stopPropagation()
        handleBlur()
        break
      }
      case 'Escape': {
        event.stopPropagation()
        setInputVisible(false)
        break
      }
      case 'a': {
        // TODO: cmdOrCtrl
        if (event.metaKey) event.stopPropagation()
        break
      }
    }
  }

  const handleChange = ({ target }) => {
    setInputValue(target.value)
  }

  const tag = spec => {
    const [variant, label, action, path] = spec.split(':')
    return (
      <Tag
        key={`${variant}:${label}`}
        id={id}
        variant={variant}
        action={action}
        label={label}
        onClose={handleClose(label)}
        capabilities={props.capabilities}
      >
        {
          variant !== 'IMAGE'
            ? <span>{label}</span>
            : <TagIcon path={mdi[path]} color='black' size='12px'/>
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
      : <Tag variant='plus' onClick={handleClick} color='black'>
          <TagIcon path={mdi.mdiPlus} size='12px'/>
          <span>ADD TAG</span>
        </Tag>
    : null


  return (

    <div className='tag-list'>
      { (tags || '').split(' ').map(tag) }
      { newTag }
    </div>
  )
})

TagList.propTypes = {
  id: PropTypes.string.isRequired,
  tags: PropTypes.string.isRequired,
  capabilities: PropTypes.string.isRequired,
  onAdd: PropTypes.func,
  onRemove: PropTypes.func
}
