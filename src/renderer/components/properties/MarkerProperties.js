import React from 'react'
import Name from './Name'
import Coordinates from './Coordinates'

const MarkerProperties = props =>
  <>
    <Name {...props}/>
    <Coordinates {...props}/>
  </>

export default MarkerProperties
