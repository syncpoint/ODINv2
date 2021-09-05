import React from 'react'
import PropTypes from 'prop-types'
import useVirtual from 'react-cool-virtual'


/**
 * Abstract list. Mainly obsessed with scrolling.
 */
const List = props => {
  const { child, focusIndex, focusId, selected, scroll } = props

  const entries = props.entries
  // const [entries, setEntries] = React.useState(props.entries)
  // React.useEffect(() => {
  //   setEntries(props.entries)
  // }, [props.entries])

  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: entries.length,
    resetScroll: true
  })

  React.useEffect(() => {
    return () => console.log('<List/> unmounting...')
  }, [])

  React.useEffect(() => {
    if (scroll === 'none') return
    if (focusIndex === -1) return
    scrollToItem({ index: focusIndex, align: 'auto', smooth: false })
  }, [scrollToItem, focusIndex, scroll])

  const handleKeyDown = event => {
    const { key } = event
    if (key === ' ') event.preventDefault()
  }

  const card = ({ index, measureRef }) => {
    if (index >= entries.length) {
      console.warn('<List/> overshooting', `${index}/${entries.length}`)
      return null
    }

    const entry = entries[index]
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
