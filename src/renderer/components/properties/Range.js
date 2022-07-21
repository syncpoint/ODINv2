/* eslint-disable react/prop-types */
import React from 'react'
import uuid from 'uuid-random'
import FlexColumn from './FlexColumn'

export default props => {
  const { id = uuid(), children, ...rest } = props

  return (
    <FlexColumn>
      <input
        type="range"
        list={id}
        { ...rest }
      />
      <datalist id={id} style={{
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        {children}
      </datalist>
    </FlexColumn>
  )
}
