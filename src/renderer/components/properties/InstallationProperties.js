import React from 'react'
import Name from './Name'
import UniqueDesignationHigherFormation from './UniqueDesignationHigherFormation'
import SpecialC2HQ from './SpecialC2HQ'
import HostilityStatus from './HostilityStatus'
import DateTimeGroup from './DateTimeGroup'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import EvaluationRating from './EvaluationRating'
import Status from './Status'
import GridCols2 from './GridCols2'
import KProperty from './KProperty'

const InstallationProperties = props =>
  <GridCols2>
    <Name {...props}/>
    <UniqueDesignationHigherFormation {...props}/>
    <SpecialC2HQ {...props}/>
    <HostilityStatus {...props}/>
    <DateTimeGroup {...props}/>
    <StaffComments {...props}/>
    <AdditionalInformation {...props}/>
    <EvaluationRating {...props}/>
    <Status {...props}/>
    <KProperty />
  </GridCols2>

export default InstallationProperties
