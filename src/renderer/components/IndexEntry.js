import React from 'react'
import PropTypes from 'prop-types'
import { Card, Avatar, TagList } from '.'
import { useServices } from './services'

/**
 * Render entry (aka option) from search index in a generic way.
 * E.g. Layer, Feature etc.
 */
const IndexEntry = React.forwardRef((props, ref) => {
  const { propertiesStore } = useServices()
  const { id, entry, dispatch } = props

  const handleClick = ({ metaKey, shiftKey }) => {
    dispatch({ type: 'click', id, shiftKey, metaKey })
  }

  const handleAddTag = React.useCallback(name => propertiesStore.addTag(id, name), [id, propertiesStore])
  const handleRemoveTag = React.useCallback(name => propertiesStore.removeTag(id, name), [id, propertiesStore])
  const handleRename = React.useCallback(value => propertiesStore.rename(id, value), [id, propertiesStore])

  return (
    <Card
      ref={ref}
      onClick={handleClick}
      focused={props.focused}
      selected={props.selected}
    >
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <Card.Content>
          <Card.Title
            id={props.id}
            value={entry.title}
            onChange={handleRename}
          />
          <Card.Description value={entry.description}/>
        </Card.Content>
        { (entry.url || entry.path) && <Avatar url={entry.url} path={entry.path}/> }
      </div>

      <TagList
        id={props.id}
        tags={entry.tags}
        capabilities={entry.capabilities}
        onAdd={handleAddTag}
        onRemove={handleRemoveTag}
      />
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
