import React from 'react'
import { useServices } from '../hooks'
import { CommandButton } from '../ToolbarButtons'
import '../Toolbar.css'

const Toolbar = props => {
  const { commandRegistry } = useServices()

  console.dir(commandRegistry)
  console.dir(commandRegistry.PRINT_SWITCH_SCOPE)

  return (
    <header className='toolbar'>
      <div className='toolbar__items-container'>
        <CommandButton command={commandRegistry.PRINT_SWITCH_SCOPE}/>
          <select>
            <option>1:2500</option>
            <option>1:5000</option>
            <option>1:10000</option>
            <option selected>1:25000</option>
            <option>1:50000</option>
            <option>1:100000</option>
            <option>1:250000</option>
          </select>
          <select>
            <option selected>A4</option>
            <option>A3</option>
            <option>A2</option>
            <option>A1</option>
            <option>A0</option>
          </select>
          <select>
            <option selected>Landscape</option>
            <option>Portrait</option>
          </select>
        <CommandButton command={commandRegistry.PRINT_MAP}/>
      </div>
    </header>
  )
}

export default Toolbar
