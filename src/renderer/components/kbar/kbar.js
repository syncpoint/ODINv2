import * as R from 'ramda'
import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import uuid from 'uuid-random'
import {
  KBarProvider as Provider,
  KBarPortal as Portal,
  KBarPositioner as Positioner,
  KBarAnimator as Animator,
  KBarSearch as Search,
  KBarResults as Results,
  useMatches,
  useKBar
} from 'kbar'
import * as MILSTD from '../../symbology/2525c'
import { svg } from '../../symbology/symbol'
import './KBar.scss'


function setCharAt (s, i, c) {
  if (i > s.length - 1) return s
  return s.substring(0, i) + c + s.substring(i + 1)
}

const globalActions = [
  {
    id: 'command:create:layer',
    name: 'Create - New Layer',
    keywords: ['create', 'new', 'layer'],
    shortcut: ['$mod+N L'],
    perform: () => console.log('perform/command:create:layer'),
    dryRun: () => {}
  },
  {
    id: 'command:create:bookmark',
    name: 'Create - New Bookmark',
    keywords: ['create', 'new', 'bookmark'],
    shortcut: ['$mod+N B'],
    perform: () => console.log('perform/command:create:bookmark'),
    dryRun: () => {}
  }
]

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
      icon: svg(sidc),
      perform: () => console.log('perform', sidc),
      dryRun: () => console.log('dryRun', sidc)
    }
  })


const List = () => {
  const { results: matches } = useMatches()
  const onRender = ({ item, active }) => {
    // if (active) item.dryRun()

    const icon = path => <Icon key={uuid()} className='ec35-key' path={mdi[path]}></Icon>
    const span = token => <span key={uuid()} className='ec35-key'>{token}</span>
    const separator = () => <span key={uuid()}>&nbsp;&nbsp;</span>

    const avatar = item.icon
      // ? <img src={item.icon} className='ec35-image'/>
      ? <div className='ec35-avatar' dangerouslySetInnerHTML={{ __html: item.icon }}/>
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

  return <Results items={matches} onRender={onRender}/>
}

const DryRunner = () => {
  const { results } = useMatches()
  const { visualState, activeIndex } = useKBar(R.identity)

  React.useEffect(() => {
    if (visualState !== 'showing') return
    const active = results[activeIndex]
    active && active.dryRun && active.dryRun()
  }, [results, activeIndex, visualState])

  React.useEffect(() => {
    if (!['animating-in', 'animating-out'].includes(visualState)) return
    console.log('visualState', visualState)
  }, [visualState])
}

export const KBar = () => {
  return (
    <Provider actions={[...globalActions, ...actions]}>
      <Portal>
        <Positioner className='ec35-positioner'>
          <Animator className='ec35-animator'>
            <Search className='ec35-search'/>
            <List/>
            <DryRunner/>
          </Animator>
        </Positioner>
      </Portal>
    </Provider>
  )
}
