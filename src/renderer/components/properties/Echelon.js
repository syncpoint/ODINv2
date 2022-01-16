import React from 'react'
import Section from './Section'
import Select from './Select'

const Echelon = () =>
  <Section id='echelon' label='Echelon'>
    <Select id='echelon'>
      <option>N/A</option>
      <option>Team/Crew - ∅</option>
      <option>Squad - ⦁</option>
      <option>Section - ⦁⦁</option>
      <option>Platoon - ⦁⦁⦁</option>
      <option>Company - |</option>
      <option>Battalion - ||</option>
      <option>Regiment/Group - |||</option>
      <option>Brigade - X</option>
      <option>Division - XX</option>
      <option>Crops - XXX</option>
      <option>Army - XXXX</option>
      <option>Front - XXXXX</option>
      <option>Region - XXXXXX</option>
      <option>Command - ++</option>
    </Select>
  </Section>

export default Echelon
