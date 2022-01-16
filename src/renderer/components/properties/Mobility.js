import React from 'react'
import Section from './Section'
import Select from './Select'

const Mobility = () =>
  <Section id='echelon' label='Mobility'>
    <Select id='mobility'>
      <option>N/A</option>
      <option>Wheeled</option>
      <option>Cross Country</option>
      <option>Tracked</option>
      <option>Wheeled/Tracked</option>
      <option>Towed</option>
      <option>Rail</option>
      <option>Over the Snow</option>
      <option>Sled</option>
      <option>Pack Animals</option>
      <option>Barge</option>
      <option>Amphibious</option>
    </Select>
  </Section>

export default Mobility
