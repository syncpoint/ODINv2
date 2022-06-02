/* eslint-disable react/prop-types */
import React from 'react'
import uuid from 'uuid-random'

const TextField = ({ id = uuid(), label, disabled, ...rest }) =>
  <div className="form-textfield">
    <input
      id={id}
      {...rest}
      placeholder="..."
      disabled={disabled}
      className='peer form-textfield__input'
    />
    <label htmlFor={id} className='form-textfield__label'>
      {label}
    </label>
  </div>

export default TextField
