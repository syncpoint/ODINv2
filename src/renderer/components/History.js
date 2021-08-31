import React from 'react'
import PropTypes from 'prop-types'
import { Breadcrumb, Menu } from 'antd'

const History = props => {
  const { entries, dispatch } = props
  const menuItemStyle = { userSelect: 'none' }

  const breadcrumbItem = entry => {
    const menuItem = item => {
      const handleClick = () => {
        dispatch({ type: 'reset', entry: { ...item, items: entry.items } })
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

    const handleClick = () => dispatch({ type: 'pop', key: entry.key })

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
      { entries.map(breadcrumbItem) }
    </Breadcrumb>
  )
}

History.propTypes = {
  entries: PropTypes.array.isRequired,
  dispatch: PropTypes.func.isRequired
}

History.whyDidYouRender = true

const HistoryMemo = React.memo(History)
export { HistoryMemo as History }
