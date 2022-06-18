/* eslint-disable react/prop-types */
import React from 'react'

const Select = ({ id, children, disabled, ...rest }) =>
  <div className='form-select'>
    <select {...rest} className='form-select__options' disabled={disabled}>
      {children}
    </select>
  </div>

export default Select
