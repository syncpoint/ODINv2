/* eslint-disable react/prop-types */
import React from 'react'

const FlexRow = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem' // gap-4
  }

  return (
    <div style={style}>{children}</div>
  )
}

export default FlexRow
