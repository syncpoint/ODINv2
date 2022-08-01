/* eslint-disable react/prop-types */
import React from 'react'

const FlexColumnGap = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  }

  return (
    <div style={style}>{children}</div>
  )
}

export default FlexColumnGap
