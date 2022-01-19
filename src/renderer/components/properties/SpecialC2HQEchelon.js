import React from 'react'
import SpecialC2HQ from './SpecialC2HQ'
import Echelon from './Echelon'

const SpecialC2HQEchelon = props =>
  <>
    <SpecialC2HQ {...props}/>
    <Echelon {...props}/>
  </>

export default SpecialC2HQEchelon
