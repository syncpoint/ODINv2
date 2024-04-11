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
import GridCols2 from './GridCols2'
import CorridorWidth from './CorridorWidth'
import DZ1Width from './DZ1Width'
import DZ2Width from './DZ2Width'
import DZ1NearDepth from './DZ1NearDepth'
import DZ1FarDepth from './DZ1FarDepth'
import * as MILSTD from '../../symbology/2525c'
import * as GEOM from '../../model/geometry'
import { readGeometry } from '../../store/FeatureStore'
import KProperty from './KProperty'

export default props => {
  const specializations = Object.values(props.features).reduce((acc, value) => {
    const { sidc } = value.properties
    const specialization = MILSTD.specialization(sidc)
    acc.push(specialization)
    return R.uniq(acc)
  }, [])

  const features = Object.entries(props.features).reduce((acc, [key, value]) => {
    const olGeometry = readGeometry(value.geometry)
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
          <RectangleWidth features={features} disabled={props.disabled} />
          <Length features={features} disabled={props.disabled} />
          <Attitude features={features} disabled={props.disabled} />
        </GridAutoColumns>
      </ColSpan2>
    ),
    CIRCLE: () => <Radius features={features} disabled={props.disabled} />,
    CORRIDOR: () => <CorridorWidth features={features} disabled={props.disabled} />,
    ARTILLERY: () =>
      <>
        <ColSpan2>
          <DZ1Width features={features} disabled={props.disabled} />
        </ColSpan2>
        <DZ1NearDepth features={features} disabled={props.disabled} />
        <DZ1FarDepth features={features} disabled={props.disabled} />
        <ColSpan2>
          <DZ2Width features={features} disabled={props.disabled} />
        </ColSpan2>
      </>

  }

  return (
    <GridCols2>
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
      <KProperty {...props}/>
    </GridCols2>
  )
}
