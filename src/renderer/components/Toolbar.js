import React from 'react'
import './Toolbar.css'
import { useServices } from './hooks'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'


const reducer = (state, { message, cell }) => {
  const newState = { ...state }
  newState[cell] = message
  return newState
}

export const Toolbar = () => {
  const { emitter, fullscreenTracker } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})
  const [className, setClassName] = React.useState('toolbar__left-items')

  React.useEffect(() => {
    emitter.on('osd', dispatch)
  }, [emitter])

  React.useEffect(() => {
    const className = active => active
      ? 'toolbar__left-items--fullscreen'
      : 'toolbar__left-items'

    setClassName(className(fullscreenTracker.isFullscreen()))

    fullscreenTracker.on('FULLSCREEN_CHANGED', ({ active }) => {
      setClassName(className(active))
    })
  }, [fullscreenTracker])

  return (
    <header className='toolbar'>
      <div className={`${className} toolbar__items-container`}>
        {state.A1} - {state.C1}
      </div>
      <div className='toolbar__right-items toolbar__items-container'>
        <Icon path={mdi.mdiContentCut} size='18px'/>
        <Icon path={mdi.mdiContentCopy} size='18px'/>
        <Icon path={mdi.mdiContentPaste} size='18px'/>
        <Icon path={mdi.mdiTrashCanOutline} size='18px'/>
        <Icon path={mdi.mdiUndo} size='18px'/>
        <Icon path={mdi.mdiRedo} size='18px'/>
      </div>
    </header>
  )
}
