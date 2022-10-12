import React from 'react'
import { Map } from './map/Map'
import { Properties } from './properties/Properties'
import { Styles } from './properties/Styles'
import { Sidebar } from './sidebar/Sidebar'
import { Toolbar } from './Toolbar'
import { KBar } from './KBar'
import { OSD } from './OSD'
import { useMemento } from './hooks'
import './Project.css'


/**
 * <Map/> and <Workspace/> are siblings with <body/> as parent.
 */
export const Project = () => {
  const [sidebarShowing] = useMemento('ui.sidebar.showing', true)
  const [toolbarShowing] = useMemento('ui.toolbar.showing', true)
  const [properties] = useMemento('ui.properties', '')

  const sidebar = sidebarShowing ? <Sidebar/> : null
  const toolbar = toolbarShowing ? <Toolbar/> : null
  const propertiesPanel = properties === 'properties'
    ? <Properties/>
    : properties === 'styles'
      ? <Styles/>
      : null

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
        <KBar/>
      </div>
    </div>
  )
}
