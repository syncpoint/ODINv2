import React from 'react'
import PropTypes from 'prop-types'
import { useServices } from '../hooks'
import { CommandButton } from '../ToolbarButtons'
import scales from './scales.json'
import paperSizes from './paperSizes.json'
import '../Toolbar.css'
import './PrintToolbar.css'

const DropDown = props => {
  const { onChange, options, selected } = props
  return (
    <select className="printToolbar_dropdown" defaultValue={selected} onChange={onChange}>
      { options.map(option => (<option key={option.value} value={option.value}>{option.text}</option>)) }
    </select>
  )
}
DropDown.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(String).isRequired,
  selected: PropTypes.string
}

const Toolbar = () => {
  const { commandRegistry, preferencesStore, emitter } = useServices()

  const [printSettings, setPrintSettings] = React.useState()
  const [restored, setRestored] = React.useState(false)

  React.useEffect(() => {
    preferencesStore.get('printSettings')
      .then(settings => setPrintSettings(settings))
      .catch(() => setPrintSettings({
        paperSize: 'a4',
        orientation: 'landscape',
        scale: '50'
      }))
      .finally(() => setRestored(true))

  }, [preferencesStore])

  React.useEffect(() => {
    if (!restored) return
    preferencesStore.put('printSettings', printSettings)
      .then(() => { emitter.emit('PRINTSETTINGS', printSettings) })
      .catch(error => console.error(error))
  }, [emitter, preferencesStore, printSettings, restored])


  const changeHandler = scope => ({ target }) => {
    const next = { ...printSettings }
    next[scope] = target.value
    setPrintSettings(next)
  }

  if (!restored) return null

  return (
    <header className='toolbar'>
      <div className='toolbar__items-container'>
        <CommandButton command={commandRegistry.PRINT_SWITCH_SCOPE}/>
        <DropDown options={Object.keys(paperSizes).map(size => ({ value: size, text: size.toUpperCase() }))} selected={printSettings.paperSize} onChange={changeHandler('paperSize')}/>
        <DropDown options={['Landscape', 'Portrait'].map(orientation => ({ value: orientation.toLowerCase(), text: orientation }))} selected={printSettings.orientation} onChange={changeHandler('orientation')}/>
        <DropDown options={scales.map(scale => ({ value: scale, text: `1:${1000 * scale}` }))} selected={printSettings.scale} onChange={changeHandler('scale')}/>
        <input type='text' placeholder='Optional title' maxLength={72} className='printToolbar_input' onChange={changeHandler('title')}/>
        <CommandButton command={commandRegistry.PRINT_MAP}/>
      </div>
    </header>
  )
}

export default Toolbar
