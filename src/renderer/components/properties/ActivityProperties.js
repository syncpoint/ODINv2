import React from 'react'
import Name from './Name'
import UniqueDesignationHigherFormation from './UniqueDesignationHigherFormation'
import SpecialC2HQ from './SpecialC2HQ'
import HostilityStatus from './HostilityStatus'
import DateTimeGroup from './DateTimeGroup'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Status from './Status'

const ActivityProperties = () =>
  <>
    <Name/>
    <UniqueDesignationHigherFormation/>
    <SpecialC2HQ/>
    <HostilityStatus/>
    <DateTimeGroup/>
    <StaffComments/>
    <AdditionalInformation/>
    <Status/>
  </>

export default ActivityProperties
