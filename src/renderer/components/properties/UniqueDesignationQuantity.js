import React from 'react'
import UniqueDesignation from './UniqueDesignation'
import Quantity from './Quantity'

const UniqueDesignationQuantity = props =>
  <>
    <UniqueDesignation {...props}/>
    <Quantity {...props}/>
  </>

export default UniqueDesignationQuantity
