/* eslint-disable */
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
  const { scope, history } = props
  if (!scope) return null

  const handleScopeMenuClick = ({ key }) => props.setScope(key)

  const menuItem = ([key, label]) => ({ key, label })

  const scopeMenu = <Menu
    style={{ userSelect: 'none' }}
    items={Object.entries(SCOPES).map(menuItem)}
    onClick={handleScopeMenuClick}
  />

  const scopeItem = <Breadcrumb.Item
    key='scope'
    overlay={scopeMenu}
  >
    <a>{SCOPES[scope]}</a>
  </Breadcrumb.Item>

  const items = history.reduce((acc, entry) => {
    return acc
  }, [scopeItem])

  return (
    <Breadcrumb
      style={{ padding: '12px', paddingBottom: '6px' }}
    >
      { items }
    </Breadcrumb>
  )
}
