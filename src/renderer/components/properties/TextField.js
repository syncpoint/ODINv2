/* eslint-disable react/prop-types */
import React from 'react'
import uuid from '../../../shared/uuid'
import './TextField.css'

const TextField = React.forwardRef(({ id = uuid(), label, disabled, ...rest }, ref) =>
  <div className="form-textfield">
    <input
      ref={ref}
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
)

export default TextField
