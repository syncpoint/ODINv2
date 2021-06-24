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
 *
 */
export const List = React.forwardRef((props, ref) => {
  const cardrefs = props.entries.map(_ => React.createRef())

  React.useEffect(() => {
    if (props.scroll === 'none') return
    scrollIntoView(cardrefs, props.focusIndex, props.scroll)
  })

  const handleKeyDown = event => {
    const { key, shiftKey, metaKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp', ' '].includes(key)) event.preventDefault()

    // Prevent native select/all:
    if (metaKey && key === 'a') event.preventDefault()

    if (metaKey && props.focusId !== null) {
      if (props.onOpen && key === 'ArrowDown') props.onOpen(props.focusId)
      if (props.onBack && key === 'ArrowUp') props.onBack(props.focusId)
    }

    props.dispatch({ path: `keydown/${key}`, shiftKey, metaKey })
  }

  const handleClick = (id, { metaKey, shiftKey }) => {
    props.dispatch({ path: 'click', id, shiftKey, metaKey })
  }

  const handleFocus = () => {
    props.dispatch({ path: 'focus' })
  }

  const card = (entry, index) => {
    const id = entry[0]
    const focused = props.focusId === id
    const selected = props.selected.includes(id)

    const className = focused
      ? 'card-container focus'
      : 'card-container'

    return (
      <div
        className={className}
        key={id}
        ref={cardrefs[index]}
        role='option'
        onClick={event => handleClick(id, event)}
      >
        { props.renderEntry(entry, { focused, selected }) }
      </div>
    )
  }

  return (
    <ul
      ref={ref}
      role='listbox'
      className='list'
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      tabIndex={0}
    >
      { props.entries.map(card) }
    </ul>
  )
})

List.propTypes = {
  entries: PropTypes.array.isRequired,
  renderEntry: PropTypes.func.isRequired,
  focusId: PropTypes.string,
  focusIndex: PropTypes.number,
  selected: PropTypes.array.isRequired,
  dispatch: PropTypes.func,
  scroll: PropTypes.string.isRequired,
  onOpen: PropTypes.func,
  onBack: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func
}
