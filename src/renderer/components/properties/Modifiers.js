import React from 'react'
import FlexColumn from './FlexColumn'
import Checkbox from './Checkbox'

const Modifiers = () =>
  <FlexColumn>
    <Checkbox name='modifiers' label='Headquarters' id='hq'/>
    <Checkbox name='modifiers' label='Task Force' id='tf'/>
    <Checkbox name='modifiers' label='Feint/Dummy' id='fd'/>
  </FlexColumn>

export default Modifiers
