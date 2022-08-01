import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import { useMemento } from '../hooks'
import { defaultSearch } from './state'
import * as ID from '../../ids'


/**
 *
 */
const ScopeSwitch = props => {
  const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)

  const enabled = search.history.length > 1
    ? false
    : search.history[0].scope.split(' ').includes(props.scope)

  const className = props.name
    ? 'e3de-tag e3de-tag--named'
    : enabled
      ? 'e3de-tag e3de-tag--scope e3de-tag--active'
      : 'e3de-tag e3de-tag--system e3de-tag--active'

  const handleClick = () => {
    const findIndex = () => search.history.findIndex(entry => entry.scope === props.scope)
    const pop = () => search.history.slice(0, findIndex() + 1)
    const reset = () => [{ key: 'root', scope: props.scope, label: props.label }]
    const history = props.name ? pop : reset
    setSearch({ history: history(), filter: '' })
  }

  return props.name
    ? <div className={className} onClick={handleClick}>
        <div className='name'>{props.name}</div>
        <div className='label'>{props.label}</div>
      </div>
    : <span className={className} onClick={handleClick}>{props.label}</span>
}

ScopeSwitch.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string.isRequired,
  scope: PropTypes.string.isRequired
}


/**
 *
 */
export const ScopeSwitcher = props => {
  const [search] = useMemento('ui.sidebar.search', defaultSearch)
  const { history } = search

  const SCOPES = {
    '#pin': 'pinned',
    '@layer': 'layer',
    '@feature': 'feature',
    '@link': 'link',
    '@symbol': 'symbol',
    '@marker': 'marker'
  }


  const defaultSwitches = Object.entries(SCOPES).map(([scope, label]) =>
    <ScopeSwitch
      key={scope}
      scope={scope}
      label={label}
    />
  )

  const childSwitches = R.drop(1, history).map(({ key, label, scope }) =>
    <ScopeSwitch
      key={key}
      scope={scope}
      name={ID.scope(key)}
      label={label}
    />
  )

  return (
    <div className='scope-container e3de-row'>
      <div className='e3de-taglist'>
        { defaultSwitches.concat(childSwitches) }
      </div>
    </div>
  )
}
