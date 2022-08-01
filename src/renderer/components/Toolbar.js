import React from 'react'
import PropTypes from 'prop-types'
import './Toolbar.css'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import { useServices } from './hooks'
import { DropdownMenu } from './DropdownMenu'

const reducer = (state, { message, cell }) => {
  const newState = { ...state }
  newState[cell] = message
  return newState
}

const Button = props => {
  const handleClick = path => event => props.onClick(path, event)

  return (
    <button
      className='toolbar__button'
      onClick={handleClick(props.path)}
    >
      <Icon path={mdi[props.path]} size='20px'/>
    </button>
  )
}


Button.propTypes = {
  path: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

const CommandButton = props => {
  const { command } = props
  const [enabled, setEnabled] = React.useState(command.enabled ? command.enabled() : true)
  const color = enabled ? '#68696B' : 'lightgrey'

  React.useEffect(() => {
    const handle = () => setEnabled(command.enabled())
    if (command.on) command.on('changed', handle)
    return command.off && (() => command.off('changed', handle))
  }, [command])

  return (
    <button
      className='toolbar__button'
      onClick={() => command.execute()}
    >
      <Icon path={mdi[command.path]} size='20px' color={color}/>
    </button>
  )
}

CommandButton.propTypes = {
  command: PropTypes.object.isRequired
}


export const Toolbar = () => {
  const { emitter, commandRegistry } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})

  const commands = [
    commandRegistry.separator(),
    commandRegistry.command('CLIPBOARD_CUT'),
    commandRegistry.command('CLIPBOARD_COPY'),
    commandRegistry.command('CLIPBOARD_PASTE'),
    commandRegistry.command('CLIPBOARD_DELETE'),
    commandRegistry.separator(),
    commandRegistry.command('UNDO_UNDO'),
    commandRegistry.command('UNDO_REDO'),
    commandRegistry.separator(),
    commandRegistry.command('LAYER_SET_DEFAULT'),
    commandRegistry.command('PIN')
  ]

  const addCommands = [
    commandRegistry.command('LAYER_CREATE'),
    commandRegistry.command('MARKER_CREATE'),
    commandRegistry.command('BOOKMARK_CREATE'),
    commandRegistry.command('VIEW_CREATE')
  ]

  // TODO: split toolbar in different components (frequent updates because of time display)
  React.useEffect(() => {
    emitter.on('osd', dispatch)
    return () => emitter.off('osd', dispatch)
  }, [emitter, dispatch])

  return (
    <header className='toolbar'>
      <div className='toolbar__left-items toolbar__items-container'>
        Default Layer:&nbsp;<b>{state.A2}</b>
      </div>
      <div className='toolbar__center-items toolbar__items-container'>
        <DropdownMenu path='mdiPlusBoxOutline' options={addCommands}/>
        {
          commands.map(([key, command]) => {
            return command === 'separator'
              ? <span key={key} className='toolbar__divider'></span>
              : <CommandButton key={key} command={command}/>
          })
        }
      </div>
    </header>
  )
}
