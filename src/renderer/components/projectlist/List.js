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
  const { child, entries, selected, focusIndex, scroll } = props
  const cardrefs = props.entries.map(_ => React.createRef())

  React.useEffect(() => {
    if (scroll === 'none') return
    if (focusIndex === -1) return
    scrollIntoView(cardrefs, focusIndex, scroll)
  }, [cardrefs, entries, selected, focusIndex, scroll])

  const handleKeyDown = event => {
    const { key } = event
    if (key === ' ') event.preventDefault()
  }

  const card = index => {
    const entry = entries[index]
    return child({
      entry,
      id: entry.id,
      focused: R.last(selected) === entry.id,
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
  selected: PropTypes.array.isRequired,
  scroll: PropTypes.string,
  focusIndex: PropTypes.number.isRequired,
  child: PropTypes.func.isRequired
}

List.whyDidYouRender = true

const ListMemo = React.memo(List)
ListMemo.whyDidYouRender = true
export { ListMemo as List }
