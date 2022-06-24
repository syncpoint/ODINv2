import React from 'react'
import PropTypes from 'prop-types'
import { Card, Avatar, Tag, TagList } from '.'
import { useServices } from './hooks'

/**
 * Render entry (aka option) from search index in a generic way.
 * E.g. Layer, Feature etc.
 */
const IndexEntry = React.forwardRef((props, ref) => {
  const { controller } = useServices()
  const { id, entry, dispatch } = props

  const handleClick = ({ metaKey, ctrlKey, shiftKey }) => {
    dispatch({ type: 'click', id, metaKey, ctrlKey, shiftKey })
  }

  const handleDoubleClick = event => {
    controller.onDoubleClick(id, event)
  }

  const description = entry.description && (
    <Card.Description>{entry.description}</Card.Description>
  )

  const tag = spec => <Tag key={spec} id={entry.id} spec={spec}/>

  return (
    <div ref={ref} key={id} style={{ padding: '3px 6px' }}>
      <Card
        id={id}
        selected={props.selected}
        capabilities={entry.capabilities}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Card.Content>
            <Card.Title
              id={props.id}
              value={entry.title}
              editing={props.editing}
            />
            { description }
          </Card.Content>
          { (entry.url || entry.path) && <Avatar url={entry.url} path={entry.path}/> }
        </div>

        <TagList>
          { entry.tags.split(' ').map(tag) }
        </TagList>
      </Card>
    </div>
  )
})

IndexEntry.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  entry: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
}

IndexEntry.whyDidYouRender = true

const IndexEntryMemo = React.memo(IndexEntry)
IndexEntryMemo.whyDidYouRender = true

export { IndexEntryMemo as IndexEntry }
