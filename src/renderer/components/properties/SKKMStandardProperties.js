import React from 'react'
import Name from './Name'
import UniqueDesignation from './UniqueDesignation'
import DateTimeGroup from './DateTimeGroup'
import Speed from './Speed'
import Direction from './Direction'
import AdditionalInformation from './AdditionalInformation'
import GridCols2 from './GridCols2'
import ColSpan2 from './ColSpan2'


const SKKMStandardProperties = props => {
  return (
    <GridCols2>
      <Name {...props}/>
      <ColSpan2><UniqueDesignation {...props}/></ColSpan2>
      <DateTimeGroup {...props}/>
      <Speed {...props}/>
      <Direction {...props}/>
      <AdditionalInformation {...props}/>
    </GridCols2>
  )
}

export default SKKMStandardProperties
