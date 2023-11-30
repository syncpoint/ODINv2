/* eslint-disable react/prop-types */
import React from 'react'
import ColSpan2 from './ColSpan2'
import { useServices } from '../hooks'

const KProperty = (props) => {
  const { emitter } = useServices()

  const toggleKBar = () => {
    emitter.emit('KBAR/TOGGLE')
  }

  return (
    <ColSpan2>
      <button className='properties__button' style={{ width: '100%' }} onClick={toggleKBar} disabled={props.disabled} >Show more actions ...</button>
    </ColSpan2>
  )
}

export default KProperty
