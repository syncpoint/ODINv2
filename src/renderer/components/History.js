import React from 'react'
import PropTypes from 'prop-types'
import { Breadcrumb, Menu } from 'antd'

const History = props => {
  const { entries, dispatch } = props
  const menuStyle = { userSelect: 'none' }


  const handleMenuClick = ({ key }) => {
    const [entryKey, itemKey] = key.split(':')
    const entry = entries.find(entry => entry.key === entryKey)
    const item = entry.items.find(item => item.key === itemKey)
    dispatch({ type: 'reset', entry: { ...item, items: entry.items } })
  }


  const breadcrumbItem = entry => {
    const menuItem = item => ({
      key: `${entry.key}:${item.key}`,
      label: item.label
    })

    const handleBreadcrumbItemClick = () => dispatch({ type: 'pop', key: entry.key })
    const overlay = entry.items && entry.items.length
      ? <Menu onClick={handleMenuClick} style={menuStyle} items={entry.items.map(menuItem)}/>
      : null

    return (
      <Breadcrumb.Item
        key={entry.key}
        overlay={overlay}
      >
        <a onClick={handleBreadcrumbItemClick}>{entry.label}</a>
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
