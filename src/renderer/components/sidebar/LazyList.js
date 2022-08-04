/* eslint-disable react/prop-types */
import React from 'react'
import useVirtual from 'react-cool-virtual'

/**
 *
 */
export const LazyList = props => {
  const { count: itemCount, scroll, focusIndex } = props
  const { outerRef, innerRef, items, scrollToItem } = useVirtual({ itemCount })

  React.useEffect(() => {
    if (scroll === 'none') return
    if (focusIndex === undefined) return
    if (focusIndex === -1) return
    scrollToItem({ index: focusIndex, align: 'auto', smooth: false })
  }, [scrollToItem, focusIndex, scroll])

  return (
    <div className='e3de-list-container' ref={outerRef}>
      <div ref={innerRef}>
        { items.map(props.renderEntry) }
      </div>
    </div>
  )
}

LazyList.whyDidYouRender = true
