import React from 'react'
import PropTypes from 'prop-types'
import useVirtual from 'react-cool-virtual'


/**
 * Abstract list. Mainly obsessed with scrolling.
 */
const List = props => {
  const { child, entries, focusId, selected } = props
  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: entries.length,
    itemSize: 200
  })

  React.useEffect(() => {
    if (props.scroll === 'none') return
    if (props.focusIndex === -1) return
    scrollToItem({ index: props.focusIndex, smooth: false })
  }, [scrollToItem, props.focusIndex, props.scroll])

  const handleKeyDown = event => {
    const { key } = event
    if (key === ' ') event.preventDefault()
  }

  const card = ({ index, measureRef }) => {
    const entry = entries[index]
    if (index >= entries.length) {
      console.warn('<List/> overshooting', `${index}/${entries.length}`)
      return null
    }

    return child({
      entry,
      id: entry.id,
      focused: focusId === entry.id,
      selected: selected.includes(entry.id),
      ref: measureRef
    })
  }

  const list = items.length
    ? items.map(card)
    : null

  return (
    <div className='list-container' ref={outerRef}>
      <div
        className='list'
        ref={innerRef}
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

// export { List }
