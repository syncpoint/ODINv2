import * as R from 'ramda'
import { styles, makeStyles } from './styles'
import { parameterized } from '../../symbology/2525c'
import * as geoms from './geometries'
import { makeGuideLines } from './guides'
import { makeHandles } from './handles'
import * as labels from './labels'
import { makeEchelonLabels } from './echelons'
import { StyleCache } from './StyleCache'
import './point'
import './linestring'
import './polygon'
import './corridor'
import './multipoint'

const createStyleFactory = context => {
  const { feature } = context
  context.makeStyles = makeStyles(feature)
  return context
}

const collectStyles = styles => context => {
  const { geometryType, feature } = context
  const sidc = parameterized(feature.get('sidc'))
  const key = styles[`${geometryType}:${sidc}`]
    ? `${geometryType}:${sidc}`
    : `${geometryType}:DEFAULT`

  context.sidc = sidc
  context.styles = styles[`${key}`](context)

  return context
}

const mapStyles = ({ styles, makeStyles }) => {
  if (!makeStyles) return []
  return styles.map(makeStyles)
}

const writeGeometries = context => {
  const { styles, write } = context
  context.styles = geoms.writeGeometries(styles, write)
  return context
}

const pipeline = R.compose(
  mapStyles,
  writeGeometries,
  makeGuideLines,
  makeHandles,
  labels.clip,
  labels.texts, // resolve label/text expressions
  makeEchelonLabels, // determine echelon, url and extent
  collectStyles(styles),
  geoms.readGeometry,
  createStyleFactory
)

const collectErrorStyles = styles => context => {
  const { geometryType } = context
  const defaultStyle = ({ geometry }) => [{ id: 'style:wasp-stroke', geometry }]
  const fn = styles[`${geometryType}:ERROR`] || defaultStyle
  context.styles = fn(context)
  return context
}

const errorPipeline = R.compose(
  mapStyles,
  writeGeometries,
  collectErrorStyles(styles),
  geoms.readGeometry,
  createStyleFactory
)

/**
 *
 */
export const featureStyle = (selection, featureSource) => {

  let currentResolution
  const cache = new StyleCache()

  // When feature is removed from source, delete all matching key from cache.
  // Failing to do so, will pull out old styles when feature is re-added
  // because of undo/redo. Note: Feature revision will restart with low value,
  // which was previously used. The remainder of the key, will be the same (mode, id).
  featureSource.on('removefeature', ({ feature }) => cache.removePartial(feature.getId()))

  return (feature, resolution) => {

    // Reset cache on resolution change:
    if (resolution !== currentResolution) {
      currentResolution = resolution
      cache.clear()
    }

    const mode = selection.isSelected(feature.getId())
      ? selection.selected().length > 1
        ? 'multiple'
        : 'selected'
      : 'default'
    const options = { feature, resolution, mode }

    try {
      const style = () => {
        const style = pipeline(options)

        if (!style) return
        return Array.isArray(style) ? style.flat() : style
      }

      const cacheKey = `${feature.getRevision()}:${mode}:${feature.getId()}`
      return cache.entry(cacheKey, style)
    } catch (err) {
      console.warn('[style]', err.message, feature)
      console.error('[style]', err)
      return errorPipeline(options).flat()
    }
  }
}
