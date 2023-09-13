import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip } from 'react-tooltip'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import './Toolbar.css'


export const SimpleButton = props => {
  const className = props.checked
    ? 'toolbar__button toolbar__button--checked'
    : 'toolbar__button'

  return (
    <>
    <button
    id={`sb-${props.path}`}
      className={className}
      onClick={() => props.onClick()}
    >
      <Icon path={mdi[props.path]} size='20px' />
    </button>
    <Tooltip anchorSelect={`#sb-${props.path}`} content={props.toolTip} style={{ zIndex: 200 }} delayShow={750}/>
    </>
  )
}

SimpleButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  toolTip: PropTypes.string
}


export const CommandButton = props => {
  const { command } = props
  const [enabled, setEnabled] = React.useState(command.enabled ? command.enabled() : true)
  const [version, setVersion] = React.useState(Date.now())

  React.useEffect(() => {
    const handle = () => { setEnabled(command.enabled()); setVersion(Date.now()) }
    if (command.on) command.on('changed', handle)
    return command.off && (() => command.off('changed', handle))
  }, [command])

  return (
    <>
    <button
      id={`cb-${command.path}`}
      className='toolbar__button'
      onClick={() => command.execute()}
      disabled={!enabled}
    >
      <Icon path={mdi[command.path]} size='20px' version={version}/>
    </button>
    <Tooltip anchorSelect={`#cb-${command.path}`} content={command.toolTip} style={{ zIndex: 200 }} delayShow={750}/>
    </>
  )
}

CommandButton.propTypes = {
  command: PropTypes.object.isRequired
}

