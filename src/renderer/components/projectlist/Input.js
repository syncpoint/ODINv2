/* eslint-disable react/prop-types */
import React from 'react'
import './Input.css'

export const Input = props => {
  const { allowClear, ...rest } = props
  return (
    <input className='ec7b-input' type='text' {...rest}/>
  )
}
