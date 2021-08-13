import React from 'react'
import PropTypes from 'prop-types'
import { indexOf } from './selection'

/**
 *
 */
export const useListStore = options => {
  const [state, setState] = React.useState({
    /** entries :: [[id, entry]] */
    entries: [],

    /** focusId :: id || null */
    focusId: null,

    focusIndex: -1,

    /** selected :: [id] */
    selected: [],
    scroll: 'smooth',
    filter: null
  })

  const fetch = async focusId => {
    const entries = await options.fetch(state.filter)
    if (focusId) {
      const focusIndex = indexOf(entries, focusId)
      setState({ ...state, entries, focusId, focusIndex, scroll: 'smooth' })
    } else {
      const focusIndex = Math.min(entries.length - 1, state.focusIndex)
      const focusId = focusIndex !== -1
        ? entries[focusIndex][0]
        : null
      setState({ ...state, entries, focusId, focusIndex, scroll: 'smooth' })
    }
  }

  React.useEffect(() => fetch(), [state.filter])

  const dispatch = event => {
    const handler = options.strategy[event.path]
    if (handler) setState(handler(state, event))
  }

  return { state, dispatch, fetch }
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
