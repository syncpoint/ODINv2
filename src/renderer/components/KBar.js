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
  useKBar,
  useMatches,
  useRegisterActions
} from 'kbar'
import { useServices, useEmitter } from './hooks'
import { Disposable } from '../../shared/disposable'
import './KBar.scss'


const List = () => {
  const { results: matches } = useMatches()
  const onRender = ({ item, active }) => {
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

  return <Results items={matches} onRender={onRender} maxHeight={300}/>
}


/**
 *
 */
const DryRunner = () => {
  const { results } = useMatches()
  const { visualState, activeIndex } = useKBar(R.identity)

  React.useEffect(() => {
    if (visualState !== 'showing') return
    const active = results[activeIndex]
    active?.dryRun?.()
  }, [results, activeIndex, visualState])
}

const ToggleListener = () => {
  const { options, query } = useKBar()
  const { emitter } = useServices()

  React.useEffect(() => {
    const toggle = () => {
      query.toggle()
      // it's weird that kbar does not call onOpen on its own
      options.callbacks?.onOpen()
    }
    emitter.on('KBAR/TOGGLE', toggle)
    return () => emitter.off('KBAR/TOGGLE', toggle)
  }, [emitter, options, query])
}


/**
 *
 */
const ActionProvider = ({ actions }) => {
  useRegisterActions(actions, [actions])
}

const positionerStyle = {
  position: 'fixed',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  width: '100%',
  inset: '0px',
  padding: '40px 16px 16px',
  zIndex: 20
}

const createSnapshot = async (store, selected) => {
  const keys = await store.collectKeys(selected, ['style'])
  return store.tuplesJSON(keys)
}

/**
 *
 */
export const KBar = () => {
  const { selection, store, kbarActions } = useServices()
  const emitter = useEmitter('kbar')
  const [snapshot, setSnapshot] = React.useState([])
  const [contextActions, setContextActions] = React.useState([])

  React.useEffect(() => {
    const disposable = Disposable.of()
    disposable.on(emitter, 'create', async () => setSnapshot(await createSnapshot(store, selection.selected())))
    disposable.on(emitter, 'restore', async () => store.update(snapshot))
    disposable.on(emitter, 'discard', () => setSnapshot([]))
    return () => disposable.dispose()
  }, [selection, store, emitter, snapshot])

  React.useEffect(() => {
    setContextActions(kbarActions.actions(snapshot))
  }, [kbarActions, snapshot])

  const options = {
    callbacks: {
      onOpen: () => emitter.emit('create'),
      onClose: () => emitter.emit('restore'),
      onSelectAction: () => emitter.emit('discard')
    }
  }

  return (
    <Provider actions={[...kbarActions.global()]} options={options}>
      <ToggleListener />
      <Portal>
        <ActionProvider actions={contextActions}/>
        <Positioner style={positionerStyle}>
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
