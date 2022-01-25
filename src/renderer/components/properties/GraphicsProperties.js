/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import UniqueDesignation from './UniqueDesignation'
import HostilityStatus from './HostilityStatus'
import EffectiveDateTime from './EffectiveDateTime'
import Altitude from './Altitude'
import StaffComments from './StaffComments'
import AdditionalInformation from './AdditionalInformation'
import Status from './Status'
import GridAutoColumns from './GridAutoColumns'
import RectangleWidth from './RectangleWidth'
import Length from './Length'
import Attitude from './Attitude'
import Radius from './Radius'
import CorridorWidth from './CorridorWidth'
import * as MILSTD from '../../symbology/2525c'
import * as GEOM from '../../model/geometry'

export default props => {
  const specializations = Object.values(props.state).reduce((acc, value) => {
    const { sidc } = value.properties
    const specialization = MILSTD.specialization(sidc)
    acc.push(specialization)
    return R.uniq(acc)
  }, [])

  const features = Object.entries(props.state).reduce((acc, [key, value]) => {
    const olGeometry = GEOM.readGeometry(value.geometry)
    const transform = GEOM.transform(olGeometry)
    acc[key] = ({ ...value, ...transform })
    return acc
  }, {})

  const specialization = specializations.length === 1
    ? specializations[0]
    : null

  const optional = {
    RECTANGLE: () => (
      <ColSpan2>
        <GridAutoColumns>
          <RectangleWidth state={features}/>
          <Length state={features}/>
          <Attitude state={features}/>
        </GridAutoColumns>
      </ColSpan2>
    ),
    CIRCLE: () => <Radius state={features}/>,
    CORRIDOR: () => <CorridorWidth state={features}/>
  }

  return (
    <>
      <Name {...props}/>
      <ColSpan2>
        <UniqueDesignation {...props}/>
      </ColSpan2>
      <HostilityStatus {...props}/>
      <EffectiveDateTime {...props}/>
      <Altitude {...props}/>
      { (optional[specialization] && optional[specialization]()) }
      <StaffComments {...props}/>
      <AdditionalInformation {...props}/>
      <Status {...props}/>
    </>
  )
}
