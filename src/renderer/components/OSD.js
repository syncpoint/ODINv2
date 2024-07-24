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
    emitter.emit('osd-mounted')
  }, [emitter])

  return <div className="osd" id="osd">
    <div className='osd__cell' style={styles.A}>{ state.A1 }</div>
    <div className='osd__cell' style={styles.B}></div>
    <div className='osd__cell' style={styles.C}>{ state.C1 }</div>
    <div className='osd__cell' style={styles.A}>{ state.A2 }</div>
    <div className='osd__cell' style={styles.B}></div>
    <div className='osd__cell' style={styles.C}>{ state.C2 }</div>
    <div className='osd__cell' style={styles.A}></div>
    <div className='osd__cell' style={styles.B}></div>
    <div className='osd__cell' style={styles.C}>{ state.C3 }</div>
  </div>
}
