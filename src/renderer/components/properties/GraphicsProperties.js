import React from 'react'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import UniqueDesignation from './UniqueDesignation'
import HostilityStatus from './HostilityStatus'
import EffectiveDateTime from './EffectiveDateTime'
import Altitude from './Altitude'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Status from './Status'

const ActivityProperties = props =>
  <>
    <Name {...props}/>
    <ColSpan2>
      <UniqueDesignation {...props}/>
    </ColSpan2>
    <HostilityStatus {...props}/>
    <EffectiveDateTime {...props}/>
    <Altitude {...props}/>
    <StaffComments {...props}/>
    <AdditionalInformation {...props}/>
    <Status {...props}/>
  </>

export default ActivityProperties
