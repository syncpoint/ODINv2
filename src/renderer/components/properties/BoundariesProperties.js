/* eslint-disable react/prop-types */
import React from 'react'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import UniqueDesignationLeft from './UniqueDesignationLeft'
import UniqueDesignationRight from './UniqueDesignationRight'
import HostilityStatus from './HostilityStatus'
import EffectiveDateTime from './EffectiveDateTime'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Status from './Status'
import GridCols2 from './GridCols2'
import Echelon from './Echelon'

export default props => {
  return (
    <GridCols2>
      <Name {...props}/>
      <ColSpan2><UniqueDesignationLeft {...props}/></ColSpan2>
      <ColSpan2><UniqueDesignationRight {...props}/></ColSpan2>
      <ColSpan2><Echelon {...props}/></ColSpan2>
      <HostilityStatus {...props}/>
      <EffectiveDateTime {...props}/>
      <StaffComments {...props}/>
      <AdditionalInformation {...props}/>
      <Status {...props}/>
    </GridCols2>
  )
}
