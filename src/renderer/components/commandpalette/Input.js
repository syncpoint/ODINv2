/* eslint-disable react/prop-types */
import React from 'react'
import './Input.scss'

export const Input = props => {
  const { allowClear, ...rest } = props
  console.log('[Input] allowClear', allowClear)
  return (
    <input className='ca08-input' type='text' {...rest}/>
  )
}
