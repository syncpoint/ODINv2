/* eslint-disable react/prop-types */
import React from 'react'
import { Swatch } from './Swatch'
import './index.scss'

export const Palette = props => {
  const handleClick = index => () => {
    props.onChange(props.colors[index])
  }

  const children = props.colors.reduce((acc, color, index) => {
    acc.push(<Swatch
      key={index}
      color={color}
      selected={color === props.color}
      undefined={color === undefined}
      onClick={handleClick(index)}
    />)
    return acc
  }, [])

  return (
    <div className='b7a2-swatch-container'>
      { children }
    </div>
  )
}
