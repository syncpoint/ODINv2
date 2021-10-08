import * as R from 'ramda'
import { makeStyles } from './styles'
import { parameterized } from '../../symbology/2525c'
import * as geoms from './geometries'
import { makeGuideLines } from './guides'
import { makeHandles } from './handles'
import * as labels from './labels'
import { makeEchelonLabels } from './echelons'

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

const collectLabels = styles => context => {
  context.styles.push(...(styles[`LABELS:${context.sidc}`] || []).flat())
  return context
}

const mapStyles = ({ styles, makeStyles }) => {
  return styles.map(makeStyles)
}

const writeGeometries = context => {
  const { styles, write } = context
  context.styles = geoms.writeGeometries(styles, write)
  return context
}

export const pipeline = (styles, { feature, resolution, mode }) => {
  return R.compose(
    mapStyles,
    writeGeometries,
    makeGuideLines,
    makeHandles,
    labels.clip,
    labels.texts,
    labels.anchors,
    makeEchelonLabels,
    collectLabels(styles),
    collectStyles(styles),
    geoms.readGeometry,
    createStyleFactory
  )(({ feature, resolution, mode }))
}
