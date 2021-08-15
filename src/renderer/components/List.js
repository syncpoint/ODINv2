import React from 'react'
import PropTypes from 'prop-types'
import { indexOf } from './selection'
import { singleselect } from './list-singleselect'
import { multiselect } from './list-multiselect'

export const strategy = {
  singleselect,
  multiselect
}

/**
 *
 */
export const useListStore = options => {
  const [state, setState] = React.useState({
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
  const { entry, focusId, selected } = props
  const cardrefs = props.entries.map(_ => React.createRef())

  React.useEffect(() => {
    if (props.scroll === 'none') return
    scrollIntoView(cardrefs, props.focusIndex, props.scroll)
  })

  const handleClick = (id, { metaKey, shiftKey }) => {
    props.dispatch({ path: 'click', id, shiftKey, metaKey })
  }

  const handleKeyDown = event => {
    console.log('<List/>', event)
    if (event.metaKey && event.key === 'a') event.preventDefault()
  }

  const card = (value, index) => entry({
    entry: value,
    focused: focusId === value.id,
    selected: selected.includes(value.id),
    ref: cardrefs[index],
    handleClick: event => handleClick(value.id, event)
  })

  return (
    <ul
      ref={ref}
      role='listbox'
      className='list'
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      { props.entries.map(card) }
    </ul>
  )
})

List.propTypes = {
  entries: PropTypes.array.isRequired,
  entry: PropTypes.func.isRequired,
  focusId: PropTypes.string,
  focusIndex: PropTypes.number,
  selected: PropTypes.array.isRequired,
  dispatch: PropTypes.func,
  scroll: PropTypes.string.isRequired
}
