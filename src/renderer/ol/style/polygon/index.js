import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles } from '../styles'
import './labels'
import './G_G_GAF' // FORTIFIED AREA
import './G_G_SAE' // ENCIRCLEMENT
import './G_M_OGB' // OBSTACLES / GENERAL / BELT
import './G_M_OGF' // OBSTACLE FREE AREA
import './G_M_OGR' // OBSTACLE RESTRICTED AREA
import './G_M_OGZ' // OBSTACLES / GENERAL / ZONE
import './G_M_SP' // STRONG POINT
import { smooth } from '../chaikin'
import { createEchelon } from '../echelons'
import * as Labels from '../styles-labels'

styles['FILL:HATCH'] = { pattern: 'hatch', angle: 45, size: 2, spacing: 12 }
styles['FILL:G*G*GAY---'] = styles['FILL:HATCH'] // LIMITED ACCESS AREA
styles['FILL:G*M*OGR---'] = styles['FILL:HATCH'] // OBSTACLE RESTRICTED AREA
styles['FILL:G*M*NB----'] = styles['FILL:HATCH'] // BIOLOGICALLY CONTAMINATED AREA
styles['FILL:G*M*NC----'] = styles['FILL:HATCH'] // CHEMICALLY CONTAMINATED AREA
styles['FILL:G*M*NR----'] = styles['FILL:HATCH'] // RADIOLOGICAL, AND NUCLEAR RADIOACTIVE AREA
styles['FILL:G*F*AKBI--'] = styles['FILL:HATCH'] // KILL BOX / BLUE
styles['FILL:G*F*AKPI--'] = styles['FILL:HATCH'] // KILL BOX / PURPLE

styles.Polygon = ({ feature, resolution, mode }) => {
  const sidc = feature.get('sidc')
  const key = parameterized(sidc)
  if (!key) return styles.DEFAULT()

  const featureStyles = makeStyles(feature, mode)
  const geometry = feature.getGeometry()
  const properties = feature.getProperties()

  const simplifiedGeometry = geometry.getCoordinates()[0].length > 50
    ? geometry.simplify(resolution)
    : geometry

  const smoothedGeometry = feature.get('style') && feature.get('style').smooth
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  const labels = (styles[`LABELS:${key}`] || []).flat()
  console.log('[Polygon] labels', labels)
  const labelOptions = Labels.styleOptions({
    resolution,
    properties,
    geometry: smoothedGeometry,
    styles: featureStyles
  })(labels)
  const texts = featureStyles.labels(labelOptions)

  const echelon = styles[key]
    ? { notchedGeometry: smoothedGeometry, icon: [] }
    : createEchelon({ sidc, resolution, geometry: smoothedGeometry })

  const handles = featureStyles.handles(simplifiedGeometry)
  const fillPattern = styles[`FILL:${key}`]
  const guides = featureStyles.guideStroke(simplifiedGeometry)
  const style = styles[key]
    ? styles[key]({ feature, resolution, styles: featureStyles, geometry: smoothedGeometry })
    : featureStyles.defaultStroke(echelon.geometry, { fillPattern })

  return [...style, ...texts, ...handles, ...guides, ...echelon.icon]
}
