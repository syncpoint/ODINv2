import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import useVirtual from 'react-cool-virtual'
import { indexOf } from './selection'


/**
 * Abstract list. Mainly obsessed with scrolling.
 */
const VirtualizedList = props => {
  const {
    child,
    editId,
    selected,
    scroll,
    entries
  } = props

  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: entries.length,
    resetScroll: true
  })

  React.useEffect(() => {
    if (scroll === 'none') return

    const focusIndex = (selected && selected.length)
      ? indexOf(entries, R.last(selected))
      : -1

    if (focusIndex === -1) return
    scrollToItem({ index: focusIndex, align: 'auto', smooth: false })
  }, [scrollToItem, selected, scroll])

  const card = ({ index, measureRef }) => {
    // Handle 'overshooting':
    if (index >= entries.length) return null

    const entry = entries[index]
    return child({
      entry,
      id: entry.id,
      selected: selected.includes(entry.id),
      editing: editId === entry.id,
      ref: measureRef
    })
  }

  const list = items.length
    ? items.map(card)
    : null

  return (
    <div className='list-container' ref={outerRef}>
      <div ref={innerRef}>
        { list }
      </div>
    </div>
  )
}

VirtualizedList.propTypes = {
  entries: PropTypes.array.isRequired,
  focusId: PropTypes.string,
  editId: PropTypes.string,
  focusIndex: PropTypes.number.isRequired,
  selected: PropTypes.array.isRequired,
  scroll: PropTypes.string,
  child: PropTypes.func.isRequired
}

VirtualizedList.whyDidYouRender = true

const VirtualizedListMemo = React.memo(VirtualizedList)
VirtualizedListMemo.whyDidYouRender = true
export { VirtualizedListMemo as VirtualizedList }
