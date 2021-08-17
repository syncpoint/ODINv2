import React from 'react'
import PropTypes from 'prop-types'
import { singleselect } from './singleselect'
import { multiselect } from './multiselect'

export const strategy = {
  singleselect,
  multiselect
}

/**
 *
 */
export const initialState = {

  /**
   * entries :: [{ id, ...any }]
   *
   * Entry must have public `id` property.
   */
  entries: [],

  /**
   * focusId :: id | null
   *
   * Used to remember focused entry between updates of entry list,
   * where focusIndex may be invalid after update.
   * if set, focusId has precedence over focusIndex.
   */
  focusId: null,

  /**
   * focusIndex :: int
   *
   * Index in entries or -1 for undefined.
   */
  focusIndex: -1,

  /**
   * selected :: [id]
   *
   * Zero, one or more ids of selected entries.
   */
  selected: [],

  /**
   * scroll: 'none' | 'smooth' | 'auto'
   *
   * Scroll behavior for element.scrollIntoView().
   */
  scroll: 'auto'
}


/**
 *
 */
export const reducer = strategy => (state, event) => {
  const handler = strategy[event.type]
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
