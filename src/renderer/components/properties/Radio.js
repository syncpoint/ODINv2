/* eslint-disable react/prop-types */
import React from 'react'
import uuid from '../../../shared/uuid'
import './Radio.css'

const Radio = ({ label, id = uuid(), ...rest }) =>
  <div className='form-radio'>
    <input {...rest} type='radio' id={id} className='form-radio-input'/>
    <label htmlFor={id} className='form-radio-label'>
      {label}
    </label>
  </div>

export default Radio
