import React from 'react'
import PropTypes from 'prop-types'
import './Toolbar.css'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import { useServices } from './hooks'
import { DropdownMenu } from './DropdownMenu'

const CommandButton = props => {
  const { command } = props
  const [enabled, setEnabled] = React.useState(command.enabled ? command.enabled() : true)

  React.useEffect(() => {
    const handle = () => setEnabled(command.enabled())
    if (command.on) command.on('changed', handle)
    return command.off && (() => command.off('changed', handle))
  }, [command])

  return (
    <button
      className='toolbar__button'
      onClick={() => command.execute()}
      disabled={!enabled}
    >
      <Icon path={mdi[command.path]} size='20px' />
    </button>
  )
}

CommandButton.propTypes = {
  command: PropTypes.object.isRequired
}


export const Toolbar = () => {
  const { commandRegistry } = useServices()

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
    commandRegistry.command('PIN'),
    commandRegistry.command('SELECT_TILE_LAYERS'),
    commandRegistry.separator()
  ]

  const addCommands = [
    commandRegistry.command('LAYER_CREATE'),
    commandRegistry.command('MARKER_CREATE'),
    commandRegistry.command('BOOKMARK_CREATE'),
    commandRegistry.command('TILE_SERVICE_CREATE')
  ]

  const measureCommands = [
    commandRegistry.command('MEASURE_BEARING_LENGTH'),
    commandRegistry.command('MEASURE_AREA')
  ]

  return (
    <header className='toolbar'>
      <div className='toolbar__center-items toolbar__items-container'>
        <DropdownMenu path='mdiPlusBoxOutline' options={addCommands}/>
        {
          commands.map(([key, command]) => {
            return command === 'separator'
              ? <span key={key} className='toolbar__divider'></span>
              : <CommandButton key={key} command={command}/>
          })
        }
        <DropdownMenu path='mdiAndroidStudio' options={measureCommands} />
      </div>
    </header>
  )
}
