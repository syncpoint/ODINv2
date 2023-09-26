/* eslint-disable react/prop-types */
import React from 'react'
import ColSpan2 from './ColSpan2'
import textProperty from './textProperty'
import { Tooltip } from 'react-tooltip'
import Icon from '@mdi/react'
import { mdiUpdate } from '@mdi/js'
import { militaryFormat } from '../../../shared/datetime'



export default props => {

  const r = React.useRef(null)

  const options = {
    label: 'Date-Time Group',
    get: feature => feature.properties.w ? feature.properties.w : null,
    set: value => feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        w: value
      }
    })
  }
  const TextProperty = textProperty(options)
  const textComponent = <TextProperty {...props} ref={r}/>

  const setDTGNow = () => {
    console.dir(textComponent)
    r.current.focus()
    r.current.set(militaryFormat.now())
  }

  return (
    <ColSpan2>
      <div style={{ display: 'flex' }}>
        { textComponent }
        <Icon path={mdiUpdate} size='20px' style={{ marginLeft: 'auto' }} className='set-dtg' onClick={setDTGNow}/>
        <Tooltip anchorSelect='.set-dtg' content='Set value of DTG to NOW' delayShow={750} />
      </div>
    </ColSpan2>
  )
}
