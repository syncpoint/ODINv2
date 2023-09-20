import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { useMemento } from '../hooks'
import { defaultSearch } from './state'
import * as ID from '../../ids'
import { IconTag } from './IconTag'
import { Tooltip } from 'react-tooltip'


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
    : <>
        <span id={`ss-${props.label}`} className={className} onClick={handleClick}>{props.label}</span>
        <Tooltip anchorSelect={`#ss-${props.label}`} content={props.toolTip} delayShow={750} />
      </>
}

ScopeSwitch.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string.isRequired,
  scope: PropTypes.string.isRequired,
  toolTip: PropTypes.string
}


/**
 *
 */
export const ScopeSwitcher = props => {
  const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)
  const { history } = search

  const setHistory = React.useCallback(history => {
    // Note: Setting/resetting history always resets filter.
    setSearch({ filter: '', history })
  }, [setSearch])

  const handleClick = () => {
    setHistory(R.dropLast(1, history))
  }

  const SCOPES = {
    '#pin': 'pinned',
    [`@${ID.LAYER}`]: 'layer',
    [`@${ID.FEATURE}`]: 'feature',
    [`@${ID.LINK}`]: 'link',
    [`@${ID.SYMBOL}`]: 'symbol',
    [`@${ID.MARKER}`]: 'marker',
    [`@${ID.BOOKMARK}`]: 'bookmark',
    [`@${ID.PLACE}`]: 'place',
    [`@${ID.TILE_SERVICE}`]: 'tile-service',
    [`@${ID.MEASURE}`]: 'measure',
    [`@${ID.INVITED}`]: 'invited'
  }

  const TOOLTIPS = {
    '#pin': 'Manage pinned items',
    [`@${ID.LAYER}`]: 'Manage existing layers',
    [`@${ID.FEATURE}`]: 'Manage existing features',
    [`@${ID.LINK}`]: 'Manage existing links',
    [`@${ID.SYMBOL}`]: 'Create new features based on the symbol palette',
    [`@${ID.MARKER}`]: 'Manage existing markers',
    [`@${ID.BOOKMARK}`]: 'Manage existing bookmarks',
    [`@${ID.PLACE}`]: 'Search for addresses based on OSM (online only)',
    [`@${ID.TILE_SERVICE}`]: 'Manage existing tile services for maps',
    [`@${ID.MEASURE}`]: 'Manage existing measurements'
  }

  const defaultSwitches = Object.entries(SCOPES).map(([scope, label]) =>
    <ScopeSwitch
      key={scope}
      scope={scope}
      label={label}
      toolTip={TOOLTIPS[scope]}
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

  const back = history.length > 1
    ? <><IconTag
        path={mdi.mdiArrowUp}
        onClick={handleClick}
        id='scope-back'
      />
      <Tooltip anchorSelect='#scope-back' content='Return to parent scope' delayShow={750} />
      </>
    : null

  return (
    <div className='scope-container e3de-row'>
      <div className='e3de-taglist'>
        { defaultSwitches.concat(childSwitches) }
        { back }
      </div>
    </div>
  )
}
