import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import * as R from 'ramda'
import { Tag } from './Tag'
import { TagIcon } from './TagIcon'
import { cmdOrCtrl } from '../platform'

/**
 * List of tags with optional slot to create a new tag.
 */
const TagList = props => {
  const { id, tags, onRemove, onAdd } = props
  const [inputVisible, setInputVisible] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.createRef()

  const handleClose = tag => () => onRemove && onRemove(tag)
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
    onAdd && onAdd(inputValue.toLowerCase())
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
      : <Tag
          variant='plus'
          onClick={handleClick}
          color='black'
        >
          <TagIcon path={mdi.mdiPlus} size='12px'/>
          <span>ADD TAG</span>
        </Tag>
    : null

  return (
    <div className='taglist'>
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
 * TagList is sibling to card content with card as parent.
 * whenever card content or its parent renders, TagList has to
 * follow suit, often with unchanged props. Hence PureThea
 * to the rescue.
 */
const TagListMemo = React.memo(TagList)
TagListMemo.whyDidYouRender = true

export { TagListMemo as TagList }
