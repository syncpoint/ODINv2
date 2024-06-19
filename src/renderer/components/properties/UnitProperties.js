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
import EvaluationRating from './EvaluationRating'
import Status from './Status'
import Condition from './Condition'
import Reinforcement from './Reinforcement'
import UnitModifiers from './UnitModifiers'
import GridCols2 from './GridCols2'
import Coordinates from './Coordinates'
import KProperty from './KProperty'

const UnitProperties = props => {
  return (
    <GridCols2>
      <Name {...props}/>
      <UniqueDesignationHigherFormation {...props}/>
      <SpecialC2HQEchelon {...props}/>
      <HostilityStatus {...props}/>
      <DateTimeGroup {...props}/>
      <Coordinates {...props}/>
      <Speed {...props}/>
      <Direction {...props}/>
      <StaffComments {...props}/>
      <AdditionalInformation {...props}/>
      <EvaluationRating {...props}/>
      <Status {...props}/>
      <Condition {...props}/>
      <Reinforcement {...props}/>
      <UnitModifiers {...props}/>
      <KProperty {...props}/>
    </GridCols2>
  )
}

export default UnitProperties
