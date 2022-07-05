import React from 'react'
import PropTypes from 'prop-types'
import './Toolbar.css'
import { useServices } from './hooks'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'


const reducer = (state, { message, cell }) => {
  const newState = { ...state }
  newState[cell] = message
  return newState
}

const Button = props => {

  const handleClick = path => event => props.onClick(path, event)

  return (
    <button
      className='toolbar__button'
      onClick={handleClick(props.path)}
    >
      <Icon path={mdi[props.path]} size='20px'/>
    </button>
  )
}


Button.propTypes = {
  path: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

export const Toolbar = () => {
  const { emitter, clipboard, undo } = useServices()
  const [state, dispatch] = React.useReducer(reducer, {})

  React.useEffect(() => {
    emitter.on('osd', dispatch)
  }, [emitter])

  const handleClick = path => {
    if (path === 'mdiContentCut') clipboard.cut()
    else if (path === 'mdiContentCopy') clipboard.copy()
    else if (path === 'mdiContentPaste') clipboard.paste()
    else if (path === 'mdiTrashCanOutline') clipboard.delete()
    else if (path === 'mdiUndo' && undo.canUndo()) undo.undo()
    else if (path === 'mdiRedo' && undo.canRedo()) undo.redo()
  }

  return (
    <header className='toolbar'>
      <div className='toolbar__left-items toolbar__items-container'>
        <Button path='mdiContentCut' onClick={handleClick}/>
        <Button path='mdiContentCopy' onClick={handleClick}/>
        <Button path='mdiContentPaste' onClick={handleClick}/>
        <Button path='mdiTrashCanOutline' onClick={handleClick}/>
        <Button path='mdiUndo' onClick={handleClick}/>
        <Button path='mdiRedo' onClick={handleClick}/>
      </div>
      <div className='toolbar__right-items toolbar__items-container'>
        {state.C1}
      </div>
    </header>
  )
}
