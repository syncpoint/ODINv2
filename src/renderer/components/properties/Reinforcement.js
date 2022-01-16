import React from 'react'
import FlexColumn from './FlexColumn'
import Checkbox from './Checkbox'

const Reinforcement = () =>
  <FlexColumn>
    <Checkbox name='reinforcement' label='Reinforced (+)' id='reinforced'/>
    <Checkbox name='reinforcement' label='Reduced (–)' id='reduced'/>
  </FlexColumn>

export default Reinforcement
