import React from 'react'
import './Statusbar.css'
import { useServices } from './hooks'

const reducer = (state, { message, cell }) => {
  const newState = { ...state }
  newState[cell] = message
  return newState
}

export const Statusbar = () => {
  const { emitter } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})

  React.useEffect(() => {
    emitter.on('osd', dispatch)
  }, [emitter])

  return (
    <footer className='statusbar'>
      <div className='statusbar__left-items statusbar__items-container'>
        <span>Default Layer: {state.A2 || 'N/A'}</span>
      </div>
      <div className='statusbar__right-items statusbar__items-container'>
        <span>{state.C2}</span>
      </div>
    </footer>
  )
}
