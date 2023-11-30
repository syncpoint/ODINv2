import React from 'react'
import ColSpan2 from './ColSpan2'
import { useServices } from '../hooks'

const KProperty = () => {
  const { emitter } = useServices()

  const toggleKBar = (e) => {
    emitter.emit('KBAR/TOGGLE')
  }

  return (
    <ColSpan2>
      <button className='properties__button' style={{ width: '100%' }} onClick={toggleKBar}>Show more actions ...</button>
    </ColSpan2>
  )
}

export default KProperty
