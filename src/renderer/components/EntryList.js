/* eslint-disable react/prop-types */
import React from 'react'
import useVirtual from 'react-cool-virtual'

/**
 *
 */
export const EntryList = props => {
  const { count, scroll, focusIndex } = props
  const { outerRef, innerRef, items, scrollToItem } = useVirtual({
    itemCount: count,
    resetScroll: true
  })

  // FIXME: hackmagic!
  // Somehow necessary to make selection/autoFocus work.
  //
  if (focusIndex !== -1 && scroll !== 'none') {
    setTimeout(() => scrollToItem({ index: focusIndex, align: 'auto', smooth: false }), 50)
  }

  return (
    <div className='e3de-list-container' ref={outerRef}>
      <div ref={innerRef}>
        { items.map(props.renderEntry) }
      </div>
    </div>
  )
}

EntryList.whyDidYouRender = true
