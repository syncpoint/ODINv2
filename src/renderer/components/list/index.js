import React from 'react'
import PropTypes from 'prop-types'
import { multiselect } from './multiselect'
import { singleselect } from './singleselect'


/**
 *
 */
const reducer = strategy => (state, event) => {
  const handler = strategy[event.path]
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
 *
 */
export const List = React.forwardRef((props, ref) => {
  const strategy = props.multiselect ? multiselect : singleselect

  const [state, dispatch] = React.useReducer(reducer(strategy), {
    ids: [],
    selected: [],
    focusIndex: -1,
    scroll: 'smooth'
  })

  const cardrefs = state.ids.map(_ => React.createRef())

  React.useEffect(() => {
    cardrefs[state.focusIndex] &&
    cardrefs[state.focusIndex].current &&
    cardrefs[state.focusIndex].current.focus()

    props.onFocus && props.onFocus(state.ids[state.focusIndex])
  }, [state.focusIndex])

  React.useEffect(() => {
    props.onSelect && props.onSelect(state.selected)
  }, [state.selected])

  React.useEffect(() => {
    if (state.scroll === 'none') return
    scrollIntoView(cardrefs, state.focusIndex, state.scroll)
  }, [state])

  React.useEffect(() => {
    const ids = props.entries.map(props.id)
    dispatch({ path: 'snapshot', ids })
  }, [props.entries])


  const handleKeyDown = event => {
    const { key, shiftKey, metaKey } = event

    // Prevent native scroll:
    if (['ArrowDown', 'ArrowUp', ' '].includes(key)) event.preventDefault()

    // Prevent native select/all:
    if (metaKey && key === 'a') event.preventDefault()

    if (metaKey && state.focusIndex !== -1) {
      const current = state.ids[state.focusIndex]
      if (props.onOpen && key === 'ArrowDown') props.onOpen(current)
      if (props.onBack && key === 'ArrowUp') props.onBack(current)
    }

    dispatch({ path: `keydown/${key}`, shiftKey, metaKey })
  }

  const handleClick = React.useCallback((index, { metaKey, shiftKey }) => {
    dispatch({ path: 'click', index, shiftKey, metaKey })
  }, [state])

  const handleFocus = () => dispatch({ path: 'focus' })

  const card = (entry, index) => {
    const focused = state.focusIndex === index
    const selected = state.selected.includes(props.id(entry))

    const className = focused
      ? 'card-container focus'
      : 'card-container'

    return (
      <div
        className={className}
        key={props.id(entry)}
        ref={cardrefs[index]}
        role='option'
        onClick={event => handleClick(index, event)}
      >
        { props.entry(entry, { focused, selected }) }
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
  entry: PropTypes.func.isRequired,
  id: PropTypes.func.isRequired,
  multiselect: PropTypes.bool,
  onOpen: PropTypes.func,
  onBack: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func
}
