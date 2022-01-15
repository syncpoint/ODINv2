import React from 'react'

const Select = ({ id, children, ...rest }) =>
  <div className='form-select'>
    <select {...rest} className='form-select__options'>
      {children}
    </select>
  </div>

export default Select
