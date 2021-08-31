import React from 'react'
import PropTypes from 'prop-types'
import { Breadcrumb, Menu } from 'antd'

export const History = props => {
  const { stack } = props
  const menuItemStyle = { userSelect: 'none' }

  const breadcrumbItem = entry => {
    const menuItem = item => {
      const handleClick = () => {
        stack.reset({ ...item, items: entry.items })
      }

      return (
        <Menu.Item
          key={`${entry.key}:${item.key}`}
          style={menuItemStyle}
          onClick={handleClick}
        >{item.label}</Menu.Item>
      )
    }

    const overlay = entry.items && entry.items.length
      ? <Menu>{ entry.items.map(menuItem) }</Menu>
      : null

    const handleClick = () => stack.pop(entry.key)

    return (
      <Breadcrumb.Item
        key={entry.key}
        overlay={overlay}
      >
        <a onClick={handleClick}>{entry.label}</a>
      </Breadcrumb.Item>
    )
  }

  return (
    <Breadcrumb style={{ padding: '12px', paddingBottom: '6px' }}>
      { stack.entries.map(breadcrumbItem) }
    </Breadcrumb>
  )
}

History.propTypes = {
  stack: PropTypes.object.isRequired
}

History.whyDidYouRender = true

