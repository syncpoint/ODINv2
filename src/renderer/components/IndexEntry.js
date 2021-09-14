import React from 'react'
import PropTypes from 'prop-types'
import { Card, Avatar, Tag } from '.'
import { useServices } from './hooks'

/**
 * Render entry (aka option) from search index in a generic way.
 * E.g. Layer, Feature etc.
 */
const IndexEntry = React.forwardRef((props, ref) => {
  const { emitter } = useServices()
  const { id, entry, dispatch } = props
  const actions = entry.actions.split('|').map(action => action.split(':'))

  const handleClick = ({ metaKey, ctrlKey, shiftKey }) => {
    dispatch({ type: 'click', id, metaKey, ctrlKey, shiftKey })
  }

  const handleDoubleClick = () => {
    const primaryAction = actions.find(([type]) => type === 'PRIMARY')

    if (primaryAction) {
      emitter.emit(`command/entry/${primaryAction[1]}`, { id })
    }
  }

  const description = entry.description && (
    <div>
      <span className='card-description'>{entry.description}</span>
    </div>
  )

  const tag = spec => <Tag key={spec} id={entry.id} spec={spec}/>

  return (
    <div ref={ref} key={id} style={{ padding: '3px 6px' }}>
      <Card
        id={id}
        focused={props.focused}
        selected={props.selected}
        capabilities={entry.capabilities}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div style={{ display: 'flex', flexDirection: 'row' }}>
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
    </div>
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
