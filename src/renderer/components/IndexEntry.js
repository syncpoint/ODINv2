import React from 'react'
import PropTypes from 'prop-types'
import { Card, Avatar, Tag } from '.'

/**
 * Render entry (aka option) from search index in a generic way.
 * E.g. Layer, Feature etc.
 */
const IndexEntry = React.forwardRef((props, ref) => {
  const { id, entry, dispatch } = props

  const handleClick = ({ metaKey, shiftKey }) => {
    dispatch({ type: 'click', id, shiftKey, metaKey })
  }

  const description = entry.description && (
    <div>
      <span className='card-description'>{entry.description}</span>
    </div>
  )

  const tag = spec => <Tag key={spec} id={entry.id} spec={spec}/>

  return (
    <Card
      focused={props.focused}
      selected={props.selected}
    >
      <div
        style={{ display: 'flex', flexDirection: 'row' }}
        ref={ref}
        onClick={handleClick}
      >
        <div className='card-content'>
          <Card.Title
            id={props.id}
            value={entry.title}
            focused={props.focused}
          />
          { description }
        </div>
        { (entry.url || entry.path) && <Avatar url={entry.url} path={entry.path}/> }
      </div>

      <div className='taglist'>
        { entry.tags.split(' ').map(tag)}
      </div>
    </Card>
  )
})

IndexEntry.propTypes = {
  id: PropTypes.string.isRequired,
  focused: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  entry: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
}

IndexEntry.whyDidYouRender = true

const IndexEntryMemo = React.memo(IndexEntry)
IndexEntryMemo.whyDidYouRender = true

export { IndexEntryMemo as IndexEntry }
