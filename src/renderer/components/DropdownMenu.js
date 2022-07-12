import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import './DropdownMenu.css'

export const DropdownMenu = props => {

  const handleClick = () => {
    document.getElementById('newDropdown').classList.toggle('show')
  }

  const handleBlur = () => {
    // Let brief background flashing show on option selection (if any).
    const hide = () => document.getElementById('newDropdown').classList.remove('show')
    setTimeout(hide, 200)
  }

  // TODO: handle ESCAPE key to close menu

  const option = ([key, { label, execute }]) => {
    const handleClick = execute || (() => {})
    return <a key={key} onClick={handleClick}>{label}</a>
  }

  return (
    <div className="dropdown">
      <button
        onClick={handleClick}
        onBlur={handleBlur}
        className="dropdown__button"
      >
        <Icon path={mdi[props.path]} size='20px'/>
        <Icon path={mdi.mdiChevronDown} size='16px'/>
      </button>
      <div id="newDropdown" className="dropdown__content">
        { props.options.map(option) }
      </div>
    </div>
  )
}

DropdownMenu.propTypes = {
  path: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired
}
