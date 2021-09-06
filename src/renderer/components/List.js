import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'


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
  const { child, focusIndex, focusId, selected, scroll, entries } = props
  const cardrefs = props.entries.map(_ => React.createRef())

  React.useEffect(() => {
    if (scroll === 'none') return
    scrollIntoView(cardrefs, focusIndex, scroll)
  }, [cardrefs, focusIndex, scroll])

  const handleKeyDown = event => {
    const { key } = event
    if (key === ' ') event.preventDefault()
  }

  const card = index => {
    const entry = entries[index]
    return child({
      entry,
      id: entry.id,
      focused: focusId === entry.id,
      selected: selected.includes(entry.id),
      ref: cardrefs[index]
    })
  }

  const list = entries.length
    ? R.range(0, entries.length).map(card)
    : null

  return (
    <div className='list-container'>
      <div
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
