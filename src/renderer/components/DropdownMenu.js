import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from 'react-tooltip'
import * as mdi from '@mdi/js'
import Icon from '@mdi/react'
import uuid from '../../shared/uuid'
import './DropdownMenu.css'

export const DropdownMenu = props => {
  const { command } = props
  const [id] = React.useState(uuid())
  const [collapsed, setCollapsed] = React.useState(true)
  const [enabled, setEnabled] = React.useState(command?.enabled ? command.enabled() : true)

  React.useEffect(() => {
    if (!command) return
    const handle = () => setEnabled(command.enabled())
    if (command.on) command.on('changed', handle)
    return command.off && (() => command.off('changed', handle))
  }, [command])

  const handleClick = () => {
    if (!enabled) return
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
    const isDisabled = command.enabled && !command.enabled()
    const handleClick = () => {
      if (isDisabled) return
      command.execute && command.execute()
    }
    const link =
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        { command.path ? <Icon path={mdi[command.path]} size='20px' /> : null }
        <span>{command.label}</span>
      </div>

    return <a key={key} onClick={handleClick} className={isDisabled ? 'dropdown__option--disabled' : ''}>{ link }</a>
  }

  return (
    <>
    <div className="dropdown" id={`dd-${id}`}>
      <button
        onClick={handleClick}
        onBlur={handleBlur}
        className="dropdown__button"
        disabled={!enabled}
      >
        <Icon path={mdi[props.path]} size='20px' color={enabled ? '#68696B' : 'lightgray'}/>
        <Icon path={mdi.mdiChevronDown} size='16px' color={enabled ? '#68696B' : 'lightgray'}/>
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
  toolTip: PropTypes.string,
  command: PropTypes.object
}
