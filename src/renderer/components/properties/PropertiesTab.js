/* eslint-disable react/prop-types */
import React from 'react'
import GridCols2 from './GridCols2'
import MarginTop3 from './MarginTop3'
import UnitProperties from './UnitProperties'
import EquipmentProperties from './EquipmentProperties'
import InstallationProperties from './InstallationProperties'
import ActivityProperties from './ActivityProperties'
import GraphicsProperties from './GraphicsProperties'
import PointProperties from './PointProperties'

const classes = {
  UNIT: props => <UnitProperties {...props}/>,
  EQUIPMENT: props => <EquipmentProperties {...props}/>,
  INSTALLATION: props => <InstallationProperties {...props}/>,
  ACTIVITY: props => <ActivityProperties {...props}/>,
  GRAPHICS: props => <GraphicsProperties {...props}/>,
  POINT: props => <PointProperties {...props}/>
}

export default props => {
  const { featureClass, ...rest } = props

  const tab = properties => (
    <GridCols2>
      <MarginTop3/>
      { properties({ ...rest })}
    </GridCols2>
  )

  return featureClass != null
    ? classes[featureClass]
      ? tab(classes[featureClass])
      : null // TODO: fallback
    : null // TODO: fallback
}
