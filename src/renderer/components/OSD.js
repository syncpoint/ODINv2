import React from 'react'
import { useServices } from './hooks'
import './OSD.css'

const reducer = (state, { message, cell }) => {
  const newState = { ...state }
  newState[cell] = message
  return newState
}

const styles = {
  A: { justifySelf: 'start' },
  B: { justifySelf: 'center' },
  C: { justifySelf: 'end' }
}

export const OSD = () => {
  const { emitter } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})

  React.useEffect(() => {
    emitter.on('osd', dispatch)
  }, [emitter])

  return <div className="osd" id="osd">
    <div className={ state.A1 ? 'osd__cell' : ''} style={styles.A}>{ state.A1 }</div>
    <div className={ state.B1 ? 'osd__cell' : ''} style={styles.B}></div>
    <div className={ state.C1 ? 'osd__cell' : ''} style={styles.C}>{ state.C1 }</div>
    <div className={ state.A2 ? 'osd__cell' : ''} style={styles.A}>{ state.A2 }</div>
    <div className={ state.B2 ? 'osd__error' : ''} style={styles.B}>{ state.B2 }</div>
    <div className={ state.C2 ? 'osd__cell' : ''} style={styles.C}>{ state.C2 }</div>
    <div className={ state.A3 ? 'osd__cell' : ''} style={styles.A}></div>
    <div className={ state.B3 ? 'osd__cell' : ''} style={styles.B}></div>
    <div className={ state.C3 ? 'osd__cell' : ''} style={styles.C}></div>
  </div>
}
