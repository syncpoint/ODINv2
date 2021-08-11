import React from 'react'
import { Map } from './Map'
import { CommandPalette } from './CommandPalette'

/**
 * <Map/> and <Project/> are siblings with <body/> as parent.
 */
export const Project = props => (
  <>
    <Map/>
    <div className='panel-container fullscreen'>
      {/* <div className="osd panel-top"/> */}
      {/* <div className="panel panel-left-"></div> */}
      {/* <div className="panel panel-right"></div> */}
    </div>
    <CommandPalette/>
  </>
)
