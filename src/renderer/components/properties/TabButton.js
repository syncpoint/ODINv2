/* eslint-disable react/prop-types */
import React from 'react'

export default props => {
  const { active, children, ...other } = props
  const className = active
    ? 'tab-container__button tab-container__button--active'
    : 'tab-container__button tab-container__button--inactive'
  return <button className={className} {...other}>{children}</button>
}
