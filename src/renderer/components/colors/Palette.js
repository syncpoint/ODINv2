/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Color from 'color'
import { Swatch } from './Swatch'
import './index.scss'

export const Palette = props => {
  const format = color => R.cond([
    [R.equals('hex'), () => color ? Color(color).hex() : color],
    [R.equals('rgb'), () => color ? Color(color).rgb().string() : color],
    [R.T, () => color]
  ])(props.format || 'hex')


  const initialColor = format(props.color)
  const colors = props.colors.map(color => format(color))

  const handleClick = index => () => {
    props.onChange(format(props.colors[index]))
  }

  const children = colors.reduce((acc, color, index) => {
    acc.push(<Swatch
      key={index}
      color={color}
      selected={color === initialColor}
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
