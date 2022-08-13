/* eslint-disable react/prop-types */
import React from 'react'
import uuid from 'uuid-random'
import './TextField.css'

const TextField = React.forwardRef(({ id = uuid(), label, disabled, ...rest }, ref) =>
  <div className="eb6a-form-textfield">
    <input
      ref={ref}
      id={id}
      {...rest}
      placeholder="..."
      disabled={disabled}
      className='peer eb6a-form-textfield__input'
    />
    <label htmlFor={id} className='eb6a-form-textfield__label'>
      {label}
    </label>
  </div>
)

export default TextField
