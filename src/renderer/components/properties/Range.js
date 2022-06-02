/* eslint-disable react/prop-types */
import React from 'react'
import uuid from 'uuid-random'
import FlexColumn from './FlexColumn'

export default props => {
  const { id = uuid() } = props

  return (
    <FlexColumn>
      <input
        type="range"
        list={id}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={props.onChange}
      />
      <datalist id={id} style={{
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        {props.children}
      </datalist>
    </FlexColumn>
  )
}
