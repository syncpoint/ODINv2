import * as R from 'ramda'
import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import uuid from 'uuid-random'
import { Map } from './map/Map'
import { Properties } from './properties/Properties'
import { CommandPalette } from './commandpalette/CommandPalette'
import { Sidebar } from './sidebar/Sidebar'
import { Toolbar } from './Toolbar'
import KBar from './kbar/kbar'
import { OSD } from './OSD'
import { useServices, useMemento } from './hooks'
import * as MILSTD from '../symbology/2525c'
import { url } from '../symbology/symbol'
import './Project.css'
import './kbar/kbar.scss'

function setCharAt (s, i, c) {
  if (i > s.length - 1) return s
  return s.substring(0, i) + c + s.substring(i + 1)
}

const actions = Object.entries(MILSTD.index)
  .filter(([key, descriptor]) => descriptor?.geometry?.type === 'Point')
  .map(([key, descriptor]) => {
    const { hierarchy } = descriptor
    const sidc = setCharAt(setCharAt(key, 1, 'F'), 3, 'P')
    const keywords = R.uniq(hierarchy.flatMap(s => s.split(' ')))
    return {
      id: key,
      name: R.last(hierarchy),
      keywords,
      icon: url(sidc),
      perform: () => console.log('perform', sidc),
      dryRun: () => console.log('dryRun', sidc)
    }
  })

const handlers = {
  palette: (state, palette) => ({ ...state, palette })
}

const reducer = (state, event) => {
  const handler = handlers[event.type]
  if (handler) return handler(state, event)
  else return state
}

const Results = () => {
  const { results: matches } = KBar.useMatches()
  const onRender = ({ item, active }) => {
    if (active) item.dryRun()

    const icon = path => <Icon key={uuid()} className='ec35-key' path={mdi[path]}></Icon>
    const span = token => <span key={uuid()} className='ec35-key'>{token}</span>
    const separator = () => <span key={uuid()}>&nbsp;&nbsp;</span>

    const avatar = item.icon
      ? <img src={item.icon} className='ec35-image'/>
      : item.shortcut
        ? item.shortcut[0].split(/( )/)
          .flatMap(token => token.split('+'))
          .map(token => {
            if (token === '$mod') return icon('mdiAppleKeyboardCommand')
            else if (token === 'Control') return icon('mdiAppleKeyboardControl')
            else if (token === 'Shift') return icon('mdiAppleKeyboardShift')
            else if (token === 'Option') return icon('mdiAppleKeyboardOption')
            else if (/^[A-Z]$/i.test(token)) return span(token)
            else if (token === ' ') return separator()
            else return token
          })
        : null

    return (
      <div className={active ? 'ec35-item ec35-item--active' : 'ec35-item'}>
        <div className='ec35-item__title'>
          {item.name}
        </div>
        <div className='ec35-item__avatar'>
          {avatar}
        </div>
      </div>
    )
  }

  return <KBar.Results items={matches} onRender={onRender}/>
}

const Logger = () => {
  const state = KBar.useKBar(state => state)
  console.log(state)
}

/**
 * <Map/> and <Workspace/> are siblings with <body/> as parent.
 */
export const Project = () => {
  const { emitter } = useServices()
  const [sidebarShowing] = useMemento('ui.sidebar.showing', true)
  const [toolbarShowing] = useMemento('ui.toolbar.showing', true)

  const [state, dispatch] = React.useReducer(reducer, {
    palette: { showing: false },
    properties: false
  })

  const handleCommandPaletteBlur = () => dispatch({ type: 'palette', showing: false })
  const handleCommandPaletteKeyDown = ({ key }) => {
    if (key === 'Escape') dispatch({ type: 'palette', showing: false })
    if (key === 'Enter') dispatch({ type: 'palette', showing: false })
  }

  React.useEffect(() => {
    const handleCommand = event => {

      switch (event.type) {
        case 'open-command-palette': {
          return dispatch({
            type: 'palette',
            showing: true,
            value: event.value,
            placeholder: event.placeholder,
            callback: event.callback
          })
        }
      }
    }

    emitter.on('command/:type', handleCommand)
    return () => emitter.off('command/:type', handleCommand)
  }, [emitter])

  const sidebar = sidebarShowing ? <Sidebar/> : null
  const toolbar = toolbarShowing ? <Toolbar/> : null

  const palette = state.palette.showing &&
    <CommandPalette
      onBlur={handleCommandPaletteBlur}
      onKeyDown={handleCommandPaletteKeyDown}
      value={state.palette.value}
      placeholder={state.palette.placeholder}
      callback={state.palette.callback}
    />

  return (
    <div className="site-container">
      { toolbar }
      <div className="content">
        { palette }
        <Map/>
        <div className="map-overlay">
          { sidebar }
          <OSD/>
          <Properties/>
        </div>
        <KBar.Provider actions={actions}>
          <KBar.Portal>
            <KBar.Positioner className='ec35-positioner'>
              <KBar.Animator className='ec35-animator'>
                <KBar.Search className='ec35-search'/>
                <Results/>
                <Logger/>
              </KBar.Animator>
            </KBar.Positioner>
          </KBar.Portal>
        </KBar.Provider>
      </div>
    </div>
  )
}
