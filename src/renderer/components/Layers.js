import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import { Breadcrumb, Menu } from 'antd'
import { FilterInput, IndexBackedList } from '.'
import { useList, useStack } from './hooks'
import { cmdOrCtrl } from '../platform'
import { isLayerId, isFeatureId } from '../ids'

const History = props => {
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

    return (
      <Breadcrumb.Item
        key={entry.key}
        overlay={overlay}
      >{entry.label}</Breadcrumb.Item>
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

/**
 * Top-most component, combining history. filter input and
 * concrete filterable list, e.g. feature list.
 */
const Marc = () => {
  const [state, dispatch] = useList({ multiselect: true })
  const [filter, setFilter] = React.useState('')

  const scopesHistoryEntry = {
    key: 'layer',
    scope: '@id:layer',
    label: 'Layers',
    items: [
      { key: 'layer', scope: '@id:layer', label: 'Layers' },
      { key: 'feature', scope: '@id:feature', label: 'Features' },
      { key: 'link', scope: '@id:link', label: 'Links' },
      { key: 'view', scope: '@id:view', label: 'Views' },
      { key: 'pinned', scope: '#pin', label: 'Pinned' }
    ]
  }

  const history = useStack([scopesHistoryEntry])

  const handleKeyDown = event => {
    const preventDefault = R.cond([
      [({ key }) => key === 'ArrowDown', R.always(true)],
      [({ key }) => key === 'ArrowUp', R.always(true)],
      [R.T, R.always(false)]
    ])

    if (preventDefault(event)) event.preventDefault()

    if (cmdOrCtrl(event) && event.key === 'ArrowUp') {
      if (history.entries.length > 1) history.pop()
    }

    if (cmdOrCtrl(event) && event.key === 'ArrowDown') {
      if (!state.focusId) return
      if (isLayerId(state.focusId)) {
        setFilter('')
        history.push({
          key: state.focusId,
          scope: `@id:feature:${state.focusId.split(':')[1]}`,
          label: state.entries[state.focusIndex].title
        })
      } else if (isFeatureId(state.focusId)) {
        setFilter('')
        history.push({
          key: state.focusId,
          scope: `@id:link @ref:${state.focusId}`,
          label: state.entries[state.focusIndex].title
        })
      }
    }

    const { key, shiftKey, metaKey, ctrlKey } = event
    dispatch({ type: `keydown/${key}`, shiftKey, metaKey, ctrlKey })
  }

  const handleFilterChange = React.useCallback(value => setFilter(value), [])

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <History stack={history}/>
      <div style={{ display: 'flex', padding: '8px' }}>
        <FilterInput size='large' value={filter} onChange={handleFilterChange}/>
      </div>
      <IndexBackedList
        scope={history.peek().scope}
        history={history}
        filter={filter}
        dispatch={dispatch}
        state={state}
      />
    </div>
  )
}

Marc.whyDidYouRender = true

/**
 * Prevent Marc from re-rendering when Workspace updated
 * one if Marcs siblings (e.g. command palette).
 */
const MarcMemo = React.memo(Marc)
MarcMemo.whyDidYouRender = true

export { MarcMemo as Layers }
