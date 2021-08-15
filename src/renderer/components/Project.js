import React from 'react'
import { Map } from './Map'
import { CommandPalette } from './CommandPalette'
import { useServices } from './services'

/**
 * <Map/> and <Project/> are siblings with <body/> as parent.
 */
export const Project = () => {
  const { emitter } = useServices()
  const [showing, setShowing] = React.useState({
    commandPalette: false,
    propertiesPanel: false,
    spotlightPanel: false
  })

  const handleCommandPaletteBlur = () => setShowing({ ...showing, commandPalette: false })
  const handleCommandPaletteKeyDown = ({ key }) => {
    if (key === 'Escape') setShowing({ ...showing, commandPalette: false })
    if (key === 'Enter') setShowing({ ...showing, commandPalette: false })
  }

  React.useEffect(() => {
    const handleCommand = event => {
      switch (event.type) {
        case 'open-command-palette': return setShowing({ ...showing, commandPalette: true })
        case 'close-command-palette': return setShowing({ ...showing, commandPalette: false })
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [])

  const commandPalette = showing.commandPalette &&
  <CommandPalette
    onBlur={handleCommandPaletteBlur}
    onKeyDown={handleCommandPaletteKeyDown}
  />

  return (
    <>
      <Map/>
      <div className='panel-container fullscreen'>
        {/* <div className="osd panel-top"/> */}
        {/* <div className="panel panel-left-"></div> */}
        {/* <div className="panel panel-right"></div> */}
      </div>
      { commandPalette }
    </>
  )
}
