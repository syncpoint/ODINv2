/* eslint-disable react/prop-types */
import React from 'react'
import GridCols3 from './GridCols3'
import LineWidth from './LineWidth'
import ColorScheme from './ColorScheme'

const LayerStyles = props => {
  return (
    <GridCols3>
      <ColorScheme {...props}/>
      <span>Stroke</span><span/><span/>
      <span>Width</span>
      <LineWidth {...props}/>
    </GridCols3>
  )
}

export default LayerStyles
