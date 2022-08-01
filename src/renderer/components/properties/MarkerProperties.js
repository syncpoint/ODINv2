import React from 'react'
import Name from './Name'
import Coordinates from './Coordinates'
import GridCols2 from './GridCols2'

const MarkerProperties = props =>
  <GridCols2>
    <Name {...props}/>
    <Coordinates {...props}/>
  </GridCols2>

export default MarkerProperties
