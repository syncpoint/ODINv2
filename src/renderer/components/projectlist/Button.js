/* eslint-disable react/prop-types */
import React from 'react'
import './Button.css'

export const Button = props => {
  const { children, danger, style, ...rest } = props

  const customStyle = danger
    ? { ...style, color: '#ff4d4f', borderColor: '#ff4d4f' }
    : style

  return <button
    className='f73b-button'
    style={customStyle}
    {...rest}
  >
    {children}
  </button>
}
