/* eslint-disable react/prop-types */
import React from 'react'
import { Breadcrumb, Menu } from 'antd'

export const SCOPES = {
  '@layer': 'Layers',
  '@feature': 'Features',
  '@link': 'Links',
  '@symbol': 'Symbols',
  '@marker': 'Markers',
  '#pin': 'Pinned'
}

export const History = props => {
  if (!props.history) return null

  // Must not buble up, since it would reset selection.
  const handleClick = event => event.stopPropagation()

  const handleMenuClick = ({ key }) => props.setHistory([{
    key: 'root',
    scope: key,
    label: SCOPES[key]
  }])

  const handleItemClick = key => () => {
    const index = props.history.findIndex(entry => entry.key === key)
    props.setHistory(props.history.slice(0, index + 1))
  }

  const overlay = index => index === 0
    ? <Menu
        style={{ userSelect: 'none' }}
        items={Object.entries(SCOPES).map(([key, label]) => ({ key, label }))}
        onClick={handleMenuClick}
      />
    : null

  const items = props.history.map((entry, index) =>
    <Breadcrumb.Item
      key={entry.key}
      overlay={overlay(index)}
    >
      <a onClick={handleItemClick(entry.key)}>{entry.label}</a>
    </Breadcrumb.Item>
  )

  return (
    <Breadcrumb
      style={{ padding: '12px', paddingBottom: '6px' }}
      onClick={handleClick}
    >
      { items }
    </Breadcrumb>
  )
}
