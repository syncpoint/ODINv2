/* eslint-disable react/prop-types */
import React from 'react'

export default ({ children }) => (
  <div style={{
    display: 'grid',
    gridAutoColumns: 'minmax(0, 1fr)',
    gridAutoFlow: 'column',
    columnGap: '1rem'
  }}>
    {children}
  </div>
)
