import React from 'react'
import { useServices } from './hooks'

const reducer = (state, { message, cell }) => {
  const newState = { ...state }
  newState[cell] = message
  // console.log(message, cell, newState)
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

  const cells = [1, 2, 3].reduce((acc, row) => {
    return ['A', 'B', 'C'].reduce((acc, column) => {
      const key = `${column}${row}`
      return acc.concat(
        <div key={ key } className='osd__cell' style={styles[column]}>{ state[key] }</div>
      )
    }, acc)
  }, [])

  return <div className="panel-top osd">{ cells }</div>
}
