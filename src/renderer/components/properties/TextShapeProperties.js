/* eslint-disable react/prop-types */
import React from 'react'
import { useServices } from '../hooks'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import GridCols2 from './GridCols2'
import { Palette } from '../colors/Palette'
import Range from './Range'
import Color from 'color'
import './Properties.css'

/**
 * Color palettes for text shapes.
 */
const textColors = [undefined, 'black', 'white', 'red', 'orange', 'gold', 'green', 'blue', 'purple']
  .map(c => c ? Color(c).hex() : undefined)

const bgColors = [undefined, 'black', 'white', 'red', 'orange', 'gold', 'green', 'blue', 'purple']
  .map(c => c ? Color(c).hex() : undefined)


/**
 * Hook to manage text shape feature properties.
 * Text shape properties are stored directly on the feature (not as separate style entries).
 */
const useTextProperties = (featureId) => {
  const { store } = useServices()
  const [feature, setFeature] = React.useState({})

  React.useEffect(() => {
    const load = async () => {
      const value = await store.value(featureId, {})
      setFeature(value || {})
    }

    const handleBatch = ({ operations }) => {
      const relevant = operations.find(op => op.key === featureId && op.type === 'put')
      if (relevant) setFeature(relevant.value)
    }

    load()
    store.on('batch', handleBatch)
    return () => store.off('batch', handleBatch)
  }, [store, featureId])

  const update = React.useCallback((newProps) => {
    const oldFeature = feature
    const newFeature = {
      ...oldFeature,
      properties: { ...oldFeature.properties, ...newProps }
    }
    store.update([featureId], [newFeature], [oldFeature])
    setFeature(newFeature)
  }, [store, featureId, feature])

  return [feature.properties || {}, update]
}


/**
 * Properties panel for text shape features.
 */
export default props => {
  const featureIds = Object.keys(props.features)
  const featureId = featureIds.length === 1 ? featureIds[0] : null

  if (!featureId) {
    return (
      <GridCols2>
        <Name {...props}/>
      </GridCols2>
    )
  }

  return <TextStyleEditor featureId={featureId} props={props} />
}


const TextStyleEditor = ({ featureId, props }) => {
  const { getMapResolution } = useServices()
  const [properties, update] = useTextProperties(featureId)

  const text = properties.text !== undefined ? properties.text : 'Text'
  const textColor = properties['text-color'] || '#000000'
  const backgroundColor = properties['background-color'] || '#FFFFFF'
  const backgroundOpacity = properties['background-opacity'] !== undefined ? properties['background-opacity'] : 0.8
  const fontSize = properties['font-size'] || 14
  const rotation = properties.rotation || 0

  const setText = (e) => update({ text: e.target.value })
  const setTextColor = color => update({ 'text-color': color })
  const setBackgroundColor = color => update({ 'background-color': color })
  const setBackgroundOpacity = ({ target }) => update({ 'background-opacity': parseFloat(target.value) })
  const setFontSize = ({ target }) => update({ 'font-size': parseInt(target.value) })
  const setRotation = ({ target }) => update({ rotation: parseInt(target.value) })
  const setReferenceResolution = () => {
    const resolution = getMapResolution?.()
    if (resolution) update({ 'reference-resolution': resolution })
  }

  return (
    <GridCols2>
      <Name {...props}/>
      <ColSpan2>
        <div className='a0d5-card'>
          <div>
            <textarea
              className='text-shape-textarea'
              value={text}
              onChange={setText}
              rows={5}
              placeholder={'# Heading\n- List item\nPlain text'}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
            />
          </div>
        </div>
      </ColSpan2>
      <ColSpan2>
        <div className='a0d5-card'>
          <div>
            <label>Text Color</label>
            <Palette color={textColor} colors={textColors} onChange={setTextColor}/>
          </div>
          <div>
            <label>Background Color</label>
            <Palette color={backgroundColor} colors={bgColors} onChange={setBackgroundColor}/>
          </div>
          <div>
            <label>Background Opacity</label>
            <Range
              min='0'
              max='1'
              step='0.1'
              value={backgroundOpacity}
              onChange={setBackgroundOpacity}
            >
              <option value='0'>Transparent</option>
              <option value='0.1'/>
              <option value='0.2'/>
              <option value='0.3'/>
              <option value='0.4'/>
              <option value='0.5'/>
              <option value='0.6'/>
              <option value='0.7'/>
              <option value='0.8'/>
              <option value='0.9'/>
              <option value='1'>Opaque</option>
            </Range>
          </div>
          <div>
            <label>Font Size</label>
            <Range
              min='10'
              max='32'
              step='2'
              value={fontSize}
              onChange={setFontSize}
            >
              <option value='10'>10</option>
              <option value='12'>12</option>
              <option value='14'>14</option>
              <option value='16'>16</option>
              <option value='18'>18</option>
              <option value='20'>20</option>
              <option value='24'>24</option>
              <option value='28'>28</option>
              <option value='32'>32</option>
            </Range>
          </div>
          <div>
            <label>Rotation</label>
            <Range
              min='0'
              max='359'
              step='1'
              value={rotation}
              onChange={setRotation}
            >
              <option value='0'>0°</option>
              <option value='45'>45°</option>
              <option value='90'>90°</option>
              <option value='135'>135°</option>
              <option value='180'>180°</option>
              <option value='225'>225°</option>
              <option value='270'>270°</option>
              <option value='315'>315°</option>
            </Range>
          </div>
          <div>
            <label>Text Scale</label>
            <button
              className='properties__button'
              style={{ width: '100%' }}
              onClick={setReferenceResolution}
            >
              Use current view as full size
            </button>
          </div>
        </div>
      </ColSpan2>
    </GridCols2>
  )
}
