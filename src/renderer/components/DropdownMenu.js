import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import './DropdownMenu.css'

export const DropdownMenu = props => {

  // const handleClick = event => {
  //   console.log('handleClick', props.onClick)
  //   props.onClick(props.path)
  // }

  const handleClick = () => {
    document.getElementById('newDropdown').classList.toggle('show')
  }

  const handleBlur = () => {
    document.getElementById('newDropdown').classList.remove('show')
  }

  return (
    <div className="dropdown">
      <button onClick={handleClick} onBlur={handleBlur} className="dropdown__button">
        <Icon path={mdi[props.path]} size='20px'/>
        <Icon path={mdi.mdiChevronDown} size='16px'/>
      </button>
      <div id="newDropdown" className="dropdown__content">
        <a href="#home">Layer...</a>
        <a href="#about">Marker...</a>
        <a href="#contact">View...</a>
      </div>
    </div>
  )
}

DropdownMenu.propTypes = {
  path: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}
