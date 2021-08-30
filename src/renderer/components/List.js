import React from 'react'
import PropTypes from 'prop-types'

/**
 *
 */
export const reducer = strategy => (state, event) => {
  const handler = strategy[event.type]
  return handler ? handler(state, event) : state
}

/**
 *
 */
const scrollIntoView = (refs, index, behavior) =>
  refs[index] &&
  refs[index].current &&
  refs[index].current.scrollIntoView({
    behavior,
    block: 'nearest'
  })


/**
 * Abstract list. Mainly obsessed with scrolling.
 */
const List = props => {
  const { child, focusId, selected } = props
  const cardrefs = props.entries.map(_ => React.createRef())

  React.useEffect(() => {
    if (props.scroll === 'none') return
    scrollIntoView(cardrefs, props.focusIndex, props.scroll)
  }, [cardrefs, props.focusIndex, props.scroll])

  const handleKeyDown = event => {
    const { key } = event
    if (key === ' ') event.preventDefault()
  }

  const card = (entry, index) => {
    return child({
      entry,
      id: entry.id,
      focused: focusId === entry.id,
      selected: selected.includes(entry.id),
      ref: cardrefs[index]
    })
  }

  const list = props.entries.length
    ? props.entries.map(card)
    : null

  return (
    <div className='list-container'>
      <div
        className='list'
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        { list }
      </div>
    </div>
  )
}

List.propTypes = {
  entries: PropTypes.array.isRequired,
  focusId: PropTypes.string,
  focusIndex: PropTypes.number.isRequired,
  selected: PropTypes.array.isRequired,
  scroll: PropTypes.string,
  child: PropTypes.func.isRequired
}

List.whyDidYouRender = true

const ListMemo = React.memo(List)
ListMemo.whyDidYouRender = true

export { ListMemo as List }
