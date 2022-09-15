/* eslint-disable react/prop-types */
import React from 'react'

const GridCols3 = ({ children }) => {
  const style = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', // grid-cols-3
    gap: '1rem' // gap-4
  }

  return (
    <div style={style}>
      {children}
    </div>
  )
}

export default GridCols3
