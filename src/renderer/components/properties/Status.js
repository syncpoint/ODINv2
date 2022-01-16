import React from 'react'
import ColSpan2 from './ColSpan2'
import GridCols2 from './GridCols2'
import FlexColumn from './FlexColumn'
import Section from './Section'
import Radio from './Radio'
import Select from './Select'

const Status = () =>
  <ColSpan2>
    <Section label='Status'>
      <GridCols2>
        <FlexColumn>
          <Radio name='status' label='Present'/>
          <Radio name='status' label='Anticipated'/>
        </FlexColumn>
        <Select>
          <option>N/A</option>
          <option>Fully Capable</option>
          <option>Damaged</option>
          <option>Destroyed</option>
          <option>Full to Capacity</option>
        </Select>
      </GridCols2>
    </Section>
  </ColSpan2>

export default Status
