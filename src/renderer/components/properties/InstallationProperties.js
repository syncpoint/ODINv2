import React from 'react'
import Name from './Name'
import UniqueDesignationHigherFormation from './UniqueDesignationHigherFormation'
import SpecialC2HQ from './SpecialC2HQ'
import HostilityStatus from './HostilityStatus'
import DateTimeGroup from './DateTimeGroup'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Status from './Status'

const InstallationProperties = props =>
  <>
    <Name {...props}/>
    <UniqueDesignationHigherFormation {...props}/>
    <SpecialC2HQ {...props}/>
    <HostilityStatus {...props}/>
    <DateTimeGroup {...props}/>
    <StaffComments {...props}/>
    <AdditionalInformation {...props}/>
    <Status {...props}/>
  </>

export default InstallationProperties
