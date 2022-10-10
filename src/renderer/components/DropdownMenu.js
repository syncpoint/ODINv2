import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import uuid from 'uuid-random'
import './DropdownMenu.css'

export const DropdownMenu = props => {

  const [id] = React.useState(uuid())

  const handleClick = () => {
    document.getElementById(id).classList.toggle('show')
  }

  const handleBlur = () => {
    // Let brief background flashing show on option selection (if any).
    const hide = () => document.getElementById(id).classList.remove('show')
    setTimeout(hide, 200)
  }

  // TODO: handle ESCAPE key to close menu

  const option = ([key, command]) => {
    const handleClick = () => command.execute && command.execute()
    return <a key={key} onClick={handleClick}>{command.label}</a>
  }

  return (
    <div className="dropdown">
      <button
        onClick={handleClick}
        onBlur={handleBlur}
        className="dropdown__button"
      >
        <Icon path={mdi[props.path]} size='20px' color='#68696B'/>
        <Icon path={mdi.mdiChevronDown} size='16px' color='#68696B'/>
      </button>
      <div id={id} className="dropdown__content">
        { props.options.map(option) }
      </div>
    </div>
  )
}

DropdownMenu.propTypes = {
  path: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired
}
