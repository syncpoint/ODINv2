import React from 'react'
import Name from './Name'
import UniqueDesignationQuantity from './UniqueDesignationQuantity'
import TypeMobility from './TypeMobility'
import HostilityStatus from './HostilityStatus'
import DateTimeGroup from './DateTimeGroup'
import Speed from './Speed'
import Direction from './Direction'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import EvaluationRating from './EvaluationRating'
import Status from './Status'
import Condition from './Condition'
import GridCols2 from './GridCols2'
import Coordinates from './Coordinates'
import KProperty from './KProperty'

const EquipmentProperties = props =>
  <GridCols2>
    <Name {...props}/>
    <UniqueDesignationQuantity {...props}/>
    <TypeMobility {...props}/>
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
    <KProperty {...props}/>
  </GridCols2>

export default EquipmentProperties
