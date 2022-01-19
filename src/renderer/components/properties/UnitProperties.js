import React from 'react'
import Name from './Name'
import UniqueDesignationHigherFormation from './UniqueDesignationHigherFormation'
import SpecialC2HQEchelon from './SpecialC2HQEchelon'
import HostilityStatus from './HostilityStatus'
import DateTimeGroup from './DateTimeGroup'
import Speed from './Speed'
import Direction from './Direction'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Status from './Status'
import Condition from './Condition'
import Reinforcement from './Reinforcement'
import UnitModifiers from './UnitModifiers'

const UnitProperties = props => {
  return (
    <>
      <Name {...props}/>
      <UniqueDesignationHigherFormation {...props}/>
      <SpecialC2HQEchelon {...props}/>
      <HostilityStatus {...props}/>
      <DateTimeGroup {...props}/>
      <Speed {...props}/>
      <Direction {...props}/>
      <StaffComments {...props}/>
      <AdditionalInformation {...props}/>
      <Status {...props}/>
      <Condition {...props}/>
      <Reinforcement {...props}/>
      <UnitModifiers {...props}/>
    </>
  )
}

export default UnitProperties
