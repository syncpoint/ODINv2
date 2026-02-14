import React from 'react'
import { Map } from './map/Map'
import { Properties } from './properties/Properties'
import { Styles } from './properties/Styles'
import { Sharing } from './properties/Sharing'
import { Sidebar } from './sidebar/Sidebar'
import { Toolbar } from './Toolbar'
import PrintToolbar from './print/Toolbar'
import { KBar } from './KBar'
import { OSD } from './OSD'
import { ElevationProfilePanel } from './ElevationProfilePanel'
import { Replication } from '../replication/Replication'
import { useMemento, useServices } from './hooks'
import './Project.css'


/**
 * <Map/> and <Workspace/> are siblings with <body/> as parent.
 */
export const Project = () => {
  const { emitter } = useServices()
  const [sidebarShowing] = useMemento('ui.sidebar.showing', true)
  const [toolbarShowing] = useMemento('ui.toolbar.showing', true)
  const [properties] = useMemento('ui.properties', 'properties')

  const [toolbarScope, setToolbarScope] = React.useState('STANDARD')

  React.useEffect(() => {
    const chooseToolbarScope = ({ scope }) => setToolbarScope(scope)

    emitter.on('TOOLBAR_SCOPE/:scope', chooseToolbarScope)
    return () => emitter.off('TOOLBAR_SCOPE/:scope', chooseToolbarScope)

  }, [emitter, setToolbarScope])

  const toolbars = {
    STANDARD: <Toolbar/>,
    PRINT: <PrintToolbar/>
  }

  const sidebar = sidebarShowing ? <Sidebar/> : null
  const toolbar = toolbarShowing ? toolbars[toolbarScope] : null

  const getPropertyPanel = (propertyScope) => {
    switch (propertyScope) {
      case 'properties': return <Properties/>
      case 'styles': return <Styles/>
      case 'sharing': return <Sharing/>
      default: return null
    }
  }

  const propertiesPanel = getPropertyPanel(properties)

  return (
    <div className="site-container">
      { toolbar }
      <div className="content">
        <div id='map-container' className='map-container'>
          <Map/>
        </div>
        <div className="map-overlay">
          { sidebar }
          <OSD/>
          { propertiesPanel }
        </div>
        <ElevationProfilePanel/>
        <KBar/>
        <Replication />
      </div>
    </div>
  )
}
