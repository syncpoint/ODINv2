import { parameterized } from '../../../symbology/2525c'
import { styles, makeStyles } from '../styles'
import '../styles-labels'
import { transform } from './commons'
import { LineStringLabels } from '../labels'
import { smooth } from '../chaikin'

/* eslint-disable no-multi-spaces */
import './G_F_LT'    // LINEAR TARGET, FINAL PROTECTIVE FIRE (FPF) and LINEAR SMOKE TARGET
import './G_G_ALx'   // AVIATION / LINES
import './G_G_GLB'   // BOUNDARIES
import './G_G_GLC'   // LINE OF CONTACT
import './G_G_GLF'   // FORWARD LINE OF OWN TROOPS (FLOT)
import './G_G_OLKA'  // DIRECTION OF ATTACK / AVIATION
import './G_G_OLKGM' // DIRECTION OF ATTACK / MAIN ATTACK
import './G_G_OLKGS' // DIRECTION OF ATTACK / SUPPORTING ATTACK
import './G_G_PF'    // DIRECTION OF ATTACK FOR FEINT
import './G_M_BCF'   // FERRY
import './G_M_BCL'   // LANE
import './G_M_BCR'   // RAFT SITE
import './G_M_OADx'  // ANTITANK DITCH / UNDER CONSTRUCTION and ... COMPLETE
import './G_M_OAR'   // ANTITANK DITCH REINFORCED WITH ANTITANK MINES
import './G_M_OEF'   // OBSTACLE EFFECT / FIX
import './G_M_OGL'   // OBSTACLES / GENERAL / LINE and ANTITANK WALL
import './G_M_OMC'   // MINE CLUSTER
import './G_M_OS'    // ABATIS
import './G_M_OWA'   // DOUBLE APRON FENCE
import './G_M_OWCD'  // DOUBLE STRAND CONCERTINA
import './G_M_OWCS'  // SINGLE CONCERTINA
import './G_M_OWCT'  // TRIPLE STRAND CONCERTINA
import './G_M_OWD'   // DOUBLE FENCE
import './G_M_OWH'   // HIGH WIRE FENCE
import './G_M_OWL'   // LOW WIRE FENCE
import './G_M_OWS'   // SINGLE FENCE
import './G_M_OWU'   // UNSPECIFIED FENCE
import './G_M_SL'    // FORTIFIED LINE
import './G_M_SW'    // FOXHOLE, EMPLACEMENT OR WEAPON SITE
import './G_O_HN'    // HAZARD / NAVIGATIONAL
import './G_S_LCH'   // HALTED CONVOY
import './G_S_LCM'   // MOVING CONVOY
import './G_T_A'     // FOLLOW AND ASSUME
import './G_T_AS'    // FOLLOW AND SUPPORT
import './G_T_F'     // TASKS / FIX
/* eslint-enable no-multi-spaces */

styles.LineString = ({ feature, resolution, mode }) => {
  const sidc = feature.get('sidc')
  const key = parameterized(sidc)
  if (!key) return styles.DEFAULT()

  const featureStyles = makeStyles(feature, mode)
  const geometry = feature.getGeometry()

  const simplifiedGeometry = geometry.getCoordinates().length > 100
    ? geometry.simplify(resolution)
    : geometry

  const smoothedGeometry = feature.get('style') && feature.get('style').smooth
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  const handles = featureStyles.handles(simplifiedGeometry)
  const labels = new LineStringLabels(smoothedGeometry, feature.getProperties())
  const texts = (styles[`LABELS:${key}`] || []).flat()
    .map(labels.label.bind(labels))
    .map(({ geometry, options }) => featureStyles.label(geometry, options))

  const guides = featureStyles.guideStroke(simplifiedGeometry)
  const style = styles[`LineString:${key}`]
    ? transform(styles[`LineString:${key}`])({
      feature,
      geometry: smoothedGeometry,
      resolution,
      styles: featureStyles
    })
    : featureStyles.defaultStroke(smoothedGeometry)

  return [...style, ...texts, ...handles, ...guides]
}
