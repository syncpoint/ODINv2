import React from 'react'
import Section from './Section'
import Checkbox from './Checkbox'
import Select from './Select'
import FlexRow from './FlexRow'
import ColSpan2 from './ColSpan2'

const HostilityStatus = () =>
  <ColSpan2>
    <Section label='Hostiliy Status (Standard Identity)'>
      <FlexRow>
        <Select>
          <option>N/A</option>
          <option>Friend</option>
          <option>Assumed Friend</option>
          <option>Hostile</option>
          <option>Neutral</option>
          <option>Unknown</option>
          <option>Joker</option>
          <option>Faker</option>
          <option>Suspect</option>
          <option>Pending</option>
        </Select>
        <div style={{ marginLeft: 'auto' }}>
          <Checkbox label='Exercise'/>
        </div>
      </FlexRow>
    </Section>
  </ColSpan2>

export default HostilityStatus
