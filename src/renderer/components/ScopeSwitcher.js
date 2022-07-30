/* eslint-disable react/prop-types */
import * as R from 'ramda'
import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import * as ID from '../ids'

/**
 *
 */
const ScopeSwitch = props => {
  const className = props.name
    ? 'e3de-tag e3de-tag--named'
    : props.enabled
      ? 'e3de-tag--scope e3de-tag--active'
      : 'e3de-tag--system e3de-tag--active'

  const handleClick = () => {
    if (props.name) {
      const index = props.history.findIndex(entry => entry.scope === props.scope)
      props.setHistory(props.history.slice(0, index + 1))
    } else {
      props.setHistory([{
        key: 'root',
        scope: props.scope,
        label: props.label
      }])
    }
  }

  const tag = props.name
    ? <div className={className} onClick={handleClick}>
        <div className='name'>{props.name}</div>
        <div className='label'>{props.label}</div>
      </div>
    : <span className={className} onClick={handleClick}>{props.label}</span>

  return tag
}


/**
 *
 */
export const ScopeSwitcher = props => {
  if (!props.history) return null

  const SCOPES = {
    '#pin': 'Pinned',
    '@layer': 'Layers',
    '@feature': 'Features',
    '@link': 'Links',
    '@symbol': 'Symbols',
    '@marker': 'Markers',
    '@view': 'View',
    '@bookmark': 'Bookmark',
    '@place': 'Place'
  }

  const enabled = scope => props.history.length > 1
    ? false
    : props.history[0].scope.split(' ').includes(scope)

  const defaultSwitches = Object.entries(SCOPES).map(([scope, label]) =>
    <ScopeSwitch
      key={scope}
      enabled={enabled(scope)}
      scope={scope}
      label={label}
      history={props.history}
      setHistory={props.setHistory}
    />
  )

  const childSwitches = R.drop(1, props.history).map(({ key, label, scope }) =>
    <ScopeSwitch
      key={key}
      enabled={false}
      scope={scope}
      name={ID.scope(key)}
      label={label}
      history={props.history}
      setHistory={props.setHistory}
    />
  )

  return (
    <div className='scope-container e3de-row'>
      <div className='e3de-taglist'>
        { defaultSwitches.concat(childSwitches) }
      </div>
      <div className='e3de-column'>
        <Icon path={mdi.mdiContentSaveOutline} size='20px' color='#68696B'/>
        <Icon path={mdi.mdiRestore} size='20px' color='#68696B'/>
      </div>
    </div>
  )
}
