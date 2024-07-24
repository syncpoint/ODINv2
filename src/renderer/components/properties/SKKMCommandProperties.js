import React from 'react'
import Name from './Name'
import UniqueDesignationHigherFormation from './UniqueDesignationHigherFormation'
import SpecialC2HQEchelon from './SpecialC2HQEchelon'
import DateTimeGroup from './DateTimeGroup'
import Speed from './Speed'
import Direction from './Direction'
import Coordinates from './Coordinates'
import AdditionalInformation from './AdditionalInformation'
import GridCols2 from './GridCols2'

const SKKMUnitProperties = props => {
  return (
    <GridCols2>
      <Name {...props}/>
      <UniqueDesignationHigherFormation {...props}/>
      <SpecialC2HQEchelon {...props}/>
      <DateTimeGroup {...props}/>
      <Coordinates {...props}/>
      <Speed {...props}/>
      <Direction {...props}/>
      <AdditionalInformation {...props}/>
    </GridCols2>
  )
}

export default SKKMUnitProperties
