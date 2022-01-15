/* eslint-disable react/prop-types */
import React from 'react'

const Section = ({ id, label, children, ...rest }) => (
  <div id={id} className='form-section'>
    {children}
    <label {...rest} className='form-section__label'>
      {label}
    </label>
  </div>
)

export default Section
