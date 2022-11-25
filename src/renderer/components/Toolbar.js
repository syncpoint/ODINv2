import React from 'react'
import './Toolbar.css'

import { useServices, useMemento } from './hooks'
import { DropdownMenu } from './DropdownMenu'
import { SimpleButton, CommandButton } from './ToolbarButtons'


// mdiFormatPaint
// mdiPaletteSwatchOutline
// mdiFileDocumentOutline



export const Toolbar = () => {
  const [properties, setProperties] = useMemento('ui.properties', '')
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
    commandRegistry.separator(),
    commandRegistry.command('PRINT_SWITCH_SCOPE')
  ]

  const addCommands = [
    commandRegistry.command('LAYER_CREATE'),
    commandRegistry.command('MARKER_CREATE'),
    commandRegistry.command('BOOKMARK_CREATE'),
    commandRegistry.command('TILE_SERVICE_CREATE')
  ]

  const measureCommands = [
    commandRegistry.command('MEASURE_DISTANCE'),
    commandRegistry.command('MEASURE_AREA')
  ]

  const toggleProperties = type => () => {
    if (properties === type) setProperties('')
    else setProperties(type)
  }

  return (
    <header className='toolbar'>
      <div className='toolbar__items-container'>
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
      <div className='toolbar__items-container toolbar__items--right'>
        <SimpleButton
          onClick={toggleProperties('properties')}
          path='mdiFileDocumentOutline'
          checked={properties === 'properties'}
        />
        <SimpleButton
          onClick={toggleProperties('styles')}
          path='mdiFormatPaint'
          checked={properties === 'styles'}
        />
      </div>
    </header>
  )
}
