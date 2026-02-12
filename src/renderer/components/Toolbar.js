import React from 'react'
import './Toolbar.css'

import { useServices, useMemento } from './hooks'
import { DropdownMenu } from './DropdownMenu'
import { SimpleButton, CommandButton } from './ToolbarButtons'
import { NIDOPopover } from './NIDOPopover'


export const Toolbar = () => {
  const [properties, setProperties] = useMemento('ui.properties', '')
  const { commandRegistry, replicationProvider } = useServices()

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

  const exportOdinCommand = commandRegistry.command('LAYER_EXPORT_ODIN')
  const exportCommands = [
    exportOdinCommand,
    commandRegistry.command('LAYER_EXPORT_GEOJSON')
  ]

  const addCommands = [
    commandRegistry.command('LAYER_CREATE'),
    commandRegistry.command('MARKER_CREATE'),
    commandRegistry.command('BOOKMARK_CREATE'),
    commandRegistry.command('TILE_SERVICE_CREATE'),
    commandRegistry.command('SSE_SERVICE_CREATE')
  ]

  const shapeCommands = [
    commandRegistry.command('DRAW_SHAPE_LINE'),
    commandRegistry.command('DRAW_SHAPE_POLYGON')
  ]

  const measureCommands = [
    commandRegistry.command('MEASURE_DISTANCE'),
    commandRegistry.command('MEASURE_AREA'),
    commandRegistry.command('MEASURE_CIRCLE'),
    commandRegistry.command('ELEVATION_PROFILE')
  ]

  const replicationCommands = [
    commandRegistry.separator(),
    commandRegistry.command('REPLICATION_LAYER_SHARE'),
    commandRegistry.command('REPLICATION_LAYER_JOIN'),
    commandRegistry.command('REPLICATION_LAYER_LEAVE'),
    commandRegistry.separator()
  ]

  const toggleProperties = type => () => {
    if (properties === type) setProperties('')
    else setProperties(type)
  }

  return (
    <header className='toolbar'>
      <div className='toolbar__items-container'>
        <DropdownMenu path='mdiPlusBoxOutline' options={addCommands} toolTip='Create new ...'/>
        {
          commands.map(([key, command]) => {
            return command === 'separator'
              ? <span key={key} className='toolbar__divider'></span>
              : <CommandButton key={key} command={command}/>
          })
        }
        <DropdownMenu path='mdiExport' options={exportCommands} toolTip='Export layer...' command={exportOdinCommand[1]} />
        <DropdownMenu path='mdiShapeOutline' options={shapeCommands} toolTip='Draw shapes ...'/>
        <DropdownMenu path='mdiAndroidStudio' options={measureCommands} toolTip='Measure ...'/>
        {
          replicationCommands.map(([key, command]) => {
            return command === 'separator'
              ? <span key={key} className='toolbar__divider'></span>
              : <CommandButton key={key} command={command}/>
          })
        }
        <NIDOPopover />
      </div>
      <div className='toolbar__items-container toolbar__items--right'>
        <SimpleButton
          onClick={toggleProperties('properties')}
          path='mdiFileDocumentOutline'
          checked={properties === 'properties'}
          toolTip='Show properties of selected items'
        />
        <SimpleButton
          onClick={toggleProperties('styles')}
          path='mdiFormatPaint'
          checked={properties === 'styles'}
          toolTip='Show styling options for selected layer'
        />
        { !replicationProvider.disabled &&
          <SimpleButton
            onClick={toggleProperties('sharing')}
            path='mdiCloudOutline'
            checked={properties === 'sharing'}
            toolTip='Show sharing options for selected layer'
          />
        }
      </div>
    </header>
  )
}
