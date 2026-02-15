/* eslint-disable react/prop-types */
import React from 'react'
import Color from 'color'
import { useServices } from '../hooks'
import * as ID from '../../ids'
import Name from './Name'
import ColSpan2 from './ColSpan2'
import GridCols2 from './GridCols2'
import { Palette } from '../colors/Palette'
import Range from './Range'
import './Properties.css'

/**
 * Extended line color palette including common colors.
 */
const lineColors = [undefined, 'black', 'white', 'red', 'orange', 'gold', 'green', 'blue', 'purple']
  .map(c => c ? Color(c).hex() : undefined)

/**
 * Fill color palette for polygons.
 */
const fillColors = [undefined, 'black', 'white', 'red', 'orange', 'gold', 'green', 'blue', 'purple']
  .map(c => c ? Color(c).hex() : undefined)


/**
 * Hook to manage feature style (style+feature:...).
 */
const useFeatureStyle = (featureId) => {
  const { store } = useServices()
  const [style, setStyle] = React.useState({})
  const styleKey = ID.styleId(featureId)

  React.useEffect(() => {
    const load = async () => {
      const value = await store.value(styleKey, {})
      setStyle(value || {})
    }

    const handleBatch = ({ operations }) => {
      const relevant = operations.find(op => op.key === styleKey && op.type === 'put')
      if (relevant) setStyle(relevant.value)
    }

    load()
    store.on('batch', handleBatch)
    return () => store.off('batch', handleBatch)
  }, [store, styleKey])

  const update = React.useCallback((newStyle) => {
    const oldStyle = style
    store.update([styleKey], [newStyle], [oldStyle])
    setStyle(newStyle)
  }, [store, styleKey, style])

  return [style, update]
}


/**
 * Properties panel for shape features (lines and polygons without military semantics).
 */
export default props => {
  const featureIds = Object.keys(props.features)
  const featureId = featureIds.length === 1 ? featureIds[0] : null

  // Determine if any feature is a polygon
  const hasPolygon = Object.values(props.features).some(
    f => f.geometry?.type === 'Polygon'
  )

  // Only show style editing for single-select
  if (!featureId) {
    return (
      <GridCols2>
        <Name {...props}/>
      </GridCols2>
    )
  }

  return <ShapeStyleEditor featureId={featureId} hasPolygon={hasPolygon} props={props} />
}


const ShapeStyleEditor = ({ featureId, hasPolygon, props }) => {
  const [style, update] = useFeatureStyle(featureId)

  const lineColor = 'line-color' in style ? style['line-color'] : '#000000'
  const lineWidth = style['line-width'] || 2
  const fillColor = style['fill-color']
  const fillOpacity = style['fill-opacity'] !== undefined ? style['fill-opacity'] : 0.2
  const lineDash = style['line-dash'] || 'solid'

  const setLineColor = color => update({ ...style, 'line-color': color || null })
  const setLineWidth = ({ target }) => update({ ...style, 'line-width': parseInt(target.value) })
  const setFillColor = color => update({ ...style, 'fill-color': color || null })
  const setFillOpacity = ({ target }) => update({ ...style, 'fill-opacity': parseFloat(target.value) })
  const setLineDash = ({ target }) => update({
    ...style,
    'line-dash': target.value === '0' ? 'solid' : target.value === '1' ? 'dashed' : 'dotted'
  })

  return (
    <GridCols2>
      <Name {...props}/>
      <ColSpan2>
        <div className='a0d5-card'>
          <div>
            <label>Line Color</label>
            <Palette color={lineColor} colors={lineColors} onChange={setLineColor}/>
          </div>
          <div>
            <label>Line Width</label>
            <Range
              min='1'
              max='6'
              step='1'
              value={lineWidth}
              onChange={setLineWidth}
            >
              <option value='1'>S</option>
              <option value='2'>M</option>
              <option value='3'>L</option>
              <option value='4'>XL</option>
              <option value='5'>XXL</option>
              <option value='6'>XXXL</option>
            </Range>
          </div>
          <div>
            <label>Line Style</label>
            <Range
              min='0'
              max='2'
              step='1'
              value={lineDash === 'dashed' ? 1 : lineDash === 'dotted' ? 2 : 0}
              onChange={setLineDash}
            >
              <option value='0'>Solid</option>
              <option value='1'>Dashed</option>
              <option value='2'>Dotted</option>
            </Range>
          </div>
        </div>
      </ColSpan2>
      { hasPolygon && (
        <ColSpan2>
          <div className='a0d5-card'>
            <div>
              <label>Fill Color</label>
              <Palette color={fillColor} colors={fillColors} onChange={setFillColor}/>
            </div>
            <div>
              <label>Fill Opacity</label>
              <Range
                min='0'
                max='1'
                step='0.1'
                value={fillOpacity}
                onChange={setFillOpacity}
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
          </div>
        </ColSpan2>
      )}
    </GridCols2>
  )
}
