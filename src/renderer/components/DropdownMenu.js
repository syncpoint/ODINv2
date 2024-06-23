import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from 'react-tooltip'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import uuid from '../../shared/uuid'
import './DropdownMenu.css'

export const DropdownMenu = props => {

  const [id] = React.useState(uuid())
  const [collapsed, setCollapsed] = React.useState(true)

  const handleClick = () => {
    document.getElementById(id).classList.toggle('show')
    setCollapsed(current => !current)
  }

  const handleBlur = () => {
    // Let brief background flashing show on option selection (if any).
    const hide = () => {
      document.getElementById(id).classList.remove('show')
      setCollapsed(true)
    }
    setTimeout(hide, 200)
  }

  const option = ([key, command]) => {
    const handleClick = () => command.execute && command.execute()
    const link =
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        { command.path ? <Icon path={mdi[command.path]} size='20px' /> : null }
        <span>{command.label}</span>
      </div>

    return <a key={key} onClick={handleClick}>{ link }</a>
  }

  return (
    <>
    <div className="dropdown" id={`dd-${id}`}>
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
    { collapsed && <Tooltip
      anchorSelect={`#dd-${id}`}
      content={props.toolTip}
      style={{ zIndex: 200 }}
      delayShow={750}
    /> }
    </>
  )
}

DropdownMenu.propTypes = {
  path: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  toolTip: PropTypes.string
}
