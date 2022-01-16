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
import UnitModifiers from './UnitModifiers'

const UnitProperties = () =>
  <>
    <Name/>
    <UniqueDesignationHigherFormation/>
    <SpecialC2HQEchelon/>
    <HostilityStatus/>
    <DateTimeGroup/>
    <Speed/>
    <Direction/>
    <StaffComments/>
    <AdditionalInformation/>
    <Status/>
    <UnitModifiers/>
  </>

export default UnitProperties
