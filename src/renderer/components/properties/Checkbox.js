/* eslint-disable react/prop-types */
import React from 'react'
import uuid from 'uuid-random'

export default ({ label, id = uuid(), disabled, ...rest }) =>
  <div className='form-checkbox'>
    <input
      {...rest}
      type="checkbox"
      id={id}
      disabled={disabled}
      className='form-checkbox__input'
    />
    <label htmlFor={id} className='form-checkbox__label'>
      {label}
    </label>
  </div>
