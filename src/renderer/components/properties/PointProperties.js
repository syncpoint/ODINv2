import React from 'react'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import UniqueDesignation from './UniqueDesignation'
import HostilityStatus from './HostilityStatus'
import EffectiveDateTime from './EffectiveDateTime'
import Altitude from './Altitude'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Coordinates from './Coordinates'
import Status from './Status'
import GridCols2 from './GridCols2'
import KProperty from './KProperty'

const PointProperties = props =>
  <GridCols2>
    <Name {...props}/>
    <ColSpan2>
      <UniqueDesignation {...props}/>
    </ColSpan2>
    <HostilityStatus {...props}/>
    <Coordinates {...props}/>
    <EffectiveDateTime {...props}/>
    <Altitude {...props}/>
    <StaffComments {...props}/>
    <AdditionalInformation {...props}/>
    <Status {...props}/>
    <KProperty {...props}/>
  </GridCols2>

export default PointProperties
