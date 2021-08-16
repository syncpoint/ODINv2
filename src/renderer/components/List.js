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
  const { child, focusId, selected } = props
  const cardrefs = props.entries.map(_ => React.createRef())

  React.useEffect(() => {
    if (props.scroll === 'none') return
    scrollIntoView(cardrefs, props.focusIndex, props.scroll)
  })


  const handleKeyDown = event => {
    if (event.metaKey && event.key === 'a') event.preventDefault()
  }

  const card = (entry, index) => child({
    entry,
    id: entry.id,
    focused: focusId === entry.id,
    selected: selected.includes(entry.id),
    ref: cardrefs[index]
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
  child: PropTypes.func.isRequired,
  entries: PropTypes.array.isRequired,
  focusId: PropTypes.string,
  focusIndex: PropTypes.number,
  selected: PropTypes.array.isRequired,
  scroll: PropTypes.string.isRequired
}
