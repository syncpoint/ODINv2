import * as R from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import * as mdi from '@mdi/js'
import { useMemento } from '../hooks'
import { defaultSearch } from './state'
import * as ID from '../../ids'
import { Tooltip } from 'react-tooltip'
import Icon from '@mdi/react'
import './ScopeSwitcher.css'


const SCOPES = {
  [`@${ID.LAYER}`]: 'mdiLayersTriple',
  [`@${ID.FEATURE}`]: 'mdiFormatListBulletedType',
  [`@${ID.LINK}`]: 'mdiLinkVariant',
  '#pin': 'mdiPinOutline',
  [`@${ID.SYMBOL}`]: 'mdiShapePlusOutline',
  [`@${ID.MARKER}`]: 'mdiCrosshairs',
  [`@${ID.BOOKMARK}`]: 'mdiBookmarkOutline',
  [`@${ID.PLACE}`]: 'mdiSearchWeb',
  [`@${ID.TILE_SERVICE}`]: 'mdiEarth',
  [`@${ID.MEASURE}`]: 'mdiAndroidStudio'
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

/**
 *
 */
const ScopeSwitch = props => {
  const [search, setSearch] = useMemento('ui.sidebar.search', defaultSearch)

  const enabled = search.history.length > 1
    ? false
    : search.history[0].scope.split(' ').includes(props.scope)

  const className = props.name
    ? 'a74a-named'
    : enabled
      ? 'a74a-scope-selector a74a-scope-selector-active'
      : 'a74a-scope-selector'

  const handleClick = () => {
    const findIndex = () => search.history.findIndex(entry => entry.scope === props.scope)
    const pop = () => search.history.slice(0, findIndex() + 1)
    const reset = () => [{ key: 'root', scope: props.scope, label: props.label }]
    const history = props.name ? pop : reset
    setSearch({ history: history(), filter: '' })
  }


  if (props.name && props.handleGoBack) {

    return <div style={{ width: '100%', border: '1px solid #e9746c', borderRadius: '2px', marginTop: '3px' }} >
      <div style={{ display: 'flex', gap: '2px', backgroundColor: '#e9746c', flexGrow: 1, color: 'white', justifyContent: 'space-between' }}>
        <Icon className='a74a-icon-active'
          path={props.scope.match(/LINK/i) === null ? mdi.mdiFormatListBulletedType : mdi.mdiLinkVariant }
        />
        <div style={{ textTransform: 'uppercase', padding: '3px', fontWeight: 400, fontSize: '0.86rem' }}>{props.name}</div>
        { props.disabled
          ? <div className='a74a-icon-active' style= {{ marginLeft: 'auto' }}/>
          : <Icon className='a74a-icon-active'
          path={mdi.mdiCloseBoxOutline}
          onClick={props.handleGoBack}
          style= {{ marginLeft: 'auto' }}
        />}
      </div>
      <div style={{ padding: '3px', fontWeight: 300, fontSize: '0.86rem' }}>{props.label}</div>
    </div>
  }

  return (
    <>
      <span id={`ss-${props.label}`} className={className} onClick={handleClick}>
        <Icon className={ enabled ? 'a74a-icon-active' : 'a74a-icon'} path={mdi[props.label]} />
      </span>
      <Tooltip anchorSelect={`#ss-${props.label}`} content={props.toolTip} delayShow={750} />
    </>
  )
}

ScopeSwitch.propTypes = {
  disabled: PropTypes.bool,
  handleGoBack: PropTypes.func,
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

  const handleGoBack = () => {
    setHistory(R.dropLast(1, history))
  }

  const defaultSwitches = Object.entries(SCOPES).map(([scope, label]) =>
    <ScopeSwitch
      key={scope}
      scope={scope}
      label={label}
      toolTip={TOOLTIPS[scope]}
    />
  )

  const childSwitches = R.drop(1, history).map(({ key, label, scope }, index, elements) => {
    return <ScopeSwitch
      key={key}
      scope={scope}
      name={ID.scope(key)}
      label={label}
      handleGoBack={handleGoBack}
      disabled={elements.length > 1 && index < elements.length - 1 }
    />
  }
  )


  return (
    <div className='a74a-taglist'>
      { defaultSwitches }
      { childSwitches }
    </div>
  )
}
