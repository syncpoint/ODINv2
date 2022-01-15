/* eslint-disable react/prop-types */
import React from 'react'
import Select from './Select'
import Section from './Section'
import Radio from './Radio'
import Checkbox from './Checkbox'

export const GridCols2 = ({ children }) => {
  const style = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', // grid-cols-2
    gap: '1rem' // gap-4
  }

  return (
    <div style={style}>
      {children}
    </div>
  )
}

export const MarginTop3 = () => <div style={{ marginTop: '0.75rem' }}/>
export const MarginBottom3 = () => <div style={{ marginBottom: '0.75rem' }}/>
export const ColSpan2 = ({ children }) => <div style={{ gridColumn: 'span 2 / span 2' }}>{children}</div>

export const SelectHostility = () =>
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

export const FlexRow = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem' // gap-4
  }

  return (
    <div style={style}>{children}</div>
  )
}

export const FlexColumn = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <div style={style}>{children}</div>
  )
}

export const HostilityStatus = () =>
  <ColSpan2>
    <Section label='Hostiliy Status (Standard Identity)'>
      <FlexRow>
        <SelectHostility/>
        <div style={{ marginLeft: 'auto' }}>
          <Checkbox label='Exercise'/>
        </div>
      </FlexRow>
    </Section>
  </ColSpan2>

export const SelectEchelon = () =>
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

export const Status = () =>
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

export const Modifiers = () =>
  <FlexColumn>
    <Checkbox name='modifiers' label='Headquarters' id='hq'/>
    <Checkbox name='modifiers' label='Task Force' id='tf'/>
    <Checkbox name='modifiers' label='Feint/Dummy' id='fd'/>
  </FlexColumn>

export const Reinforcement = () =>
  <FlexColumn>
    <Checkbox name='reinforcement' label='Reinforced (+)' id='reinforced'/>
    <Checkbox name='reinforcement' label='Reduced (–)' id='reduced'/>
  </FlexColumn>
