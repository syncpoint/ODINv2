/* eslint-disable react/prop-types */
import React from 'react'

const GridCols2 = ({ children }) => {
  const style = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', // grid-cols-2
    gap: '1rem' // gap-4
  }

  return (
    <div style={style}>
      {children}
    </div>
  )
}

export default GridCols2
