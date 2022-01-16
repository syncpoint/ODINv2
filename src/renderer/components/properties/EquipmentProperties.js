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
import Status from './Status'

const EquipmentProperties = () =>
  <>
    <Name/>
    <UniqueDesignationQuantity/>
    <TypeMobility/>
    <HostilityStatus/>
    <DateTimeGroup/>
    <Speed/>
    <Direction/>
    <StaffComments/>
    <AdditionalInformation/>
    <Status/>
  </>

export default EquipmentProperties
