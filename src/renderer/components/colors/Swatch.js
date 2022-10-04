/* eslint-disable react/prop-types */
import React from 'react'
import Color from 'color'
import './index.scss'

export const Swatch = props => {
  const color = Color(props.color)
  const indicatorColor = props.color
    ? color.isLight() ? '#000' : '#fff'
    : '#000'

  const style = { backgroundColor: props.color }
  const children = props.selected
    ? <div className='b7a2-swatch__indicator' style={{ borderTopColor: indicatorColor }}/>
    : null

  const className = props.undefined
    ? 'b7a2-swatch b7a2-swatch--undefined'
    : 'b7a2-swatch'

  return (
    <div
      className={className}
      style={style}
      tabIndex={0}
      onClick={props.onClick}
    >
      { children }
    </div>
  )
}
