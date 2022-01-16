import React from 'react'
import ColSpan2 from './ColSpan2'
import MarginTop3 from './MarginTop3'
import MarginBottom3 from './MarginBottom3'
import GridCols2 from './GridCols2'
import Section from './Section'
import Modifiers from './Modifiers'
import Reinforcement from './Reinforcement'

const UnitModifiers = () =>
  <ColSpan2>
    <MarginTop3/>
    <Section label='Modifiers'>
      <GridCols2>
        <Modifiers/>
        <Reinforcement/>
      </GridCols2>
    </Section>
    <MarginBottom3/>
  </ColSpan2>

export default UnitModifiers
