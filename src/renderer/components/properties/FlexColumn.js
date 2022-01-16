/* eslint-disable react/prop-types */
import React from 'react'

const FlexColumn = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <div style={style}>{children}</div>
  )
}

export default FlexColumn
