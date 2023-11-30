import React from 'react'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import UniqueDesignation from './UniqueDesignation'
import HostilityStatus from './HostilityStatus'
import DateTimeGroup from './DateTimeGroup'
import Speed from './Speed'
import Direction from './Direction'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import EvaluationRating from './EvaluationRating'
import Status from './Status'
import GridCols2 from './GridCols2'
import KProperty from './KProperty'

const ActivityProperties = props =>
  <GridCols2>
    <Name {...props}/>
    <ColSpan2>
      <UniqueDesignation {...props}/>
    </ColSpan2>
    <HostilityStatus {...props}/>
    <DateTimeGroup {...props}/>
    <Speed {...props}/>
    <Direction {...props}/>
    <StaffComments {...props}/>
    <AdditionalInformation {...props}/>
    <EvaluationRating {...props}/>
    <Status {...props}/>
    <KProperty />
  </GridCols2>

export default ActivityProperties
