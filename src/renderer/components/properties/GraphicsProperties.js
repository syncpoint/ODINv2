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
import Width from './Width'
import Length from './Length'
import Attitude from './Attitude'
import Radius from './Radius'
import * as MILSTD from '../../symbology/2525c'

export default props => {
  const features = Object.values(props.state)
  const specializations = features.reduce((acc, value) => {
    const { sidc } = value.properties
    const specialization = MILSTD.specialization(sidc)
    acc.push(specialization)
    return R.uniq(acc)
  }, [])

  const optional = {
    RECTANGLE: () => (
      <ColSpan2>
        <GridAutoColumns>
          <Width {...props}/>
          <Length {...props}/>
          <Attitude {...props}/>
        </GridAutoColumns>
      </ColSpan2>
    ),
    CIRCLE: () => <Radius {...props}/>
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
      {
        specializations.length === 1
          ? optional[specializations[0]] && optional[specializations[0]]()
          : null
      }
      <StaffComments {...props}/>
      <AdditionalInformation {...props}/>
      <Status {...props}/>
    </>
  )
}
