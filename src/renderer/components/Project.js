import React from 'react'
import { Map } from './map/Map'
import { Properties } from './properties/Properties'
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

  const sidebar = sidebarShowing ? <Sidebar/> : null
  const toolbar = toolbarShowing ? <Toolbar/> : null

  return (
    <div className="site-container">
      { toolbar }
      <div className="content">
        <Map/>
        <div className="map-overlay">
          { sidebar }
          <OSD/>
          <Properties/>
        </div>
        <KBar/>
      </div>
    </div>
  )
}
