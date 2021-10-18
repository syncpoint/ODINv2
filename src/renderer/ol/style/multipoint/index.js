import { styles } from '../styles'
import * as TS from '../../ts'
import './G_F_AXC' // SENSOR RANGE FAN
import './G_M_NM' // MINIMUM SAFE DISTANCE ZONES
import './G_T_E' // TASKS / ISOLATE
import './G_T_O' // TASKS / OCCUPY
import './G_T_Q' // TASKS / RETAIN
import './G_T_S' // TASKS / SECURE
import './G_T_Ux' // TASKS / SCREEN, GUARD, COVER and SEARCH AREA/RECONNAISSANCE AREA


const circle = id => context => {
  const [C, A] = TS.coordinates(context.geometry)
  const segment = TS.segment([C, A])
  const geometry = TS.pointBuffer(TS.point(C))(segment.getLength())
  const labels = styles[`LABELS:${context.sidc}`] || []

  return [
    { id, geometry },
    ...labels.map(styles['LABELS:GEOMETRY:POLYGON'](geometry))
  ]
}

styles['MultiPoint:DEFAULT'] = ({ geometry }) => [{ id: 'style:default', geometry }]
styles['MultiPoint:CIRCLE'] = circle('style:2525c/default-stroke')
styles['MultiPoint:FILLED-CIRCLE'] = circle('style:2525c/hatch-fill')

const HALO = { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }
const C = (text, options) => [{ id: 'style:default-text', 'text-field': text, 'text-clipping': 'none', ...options }]
const B = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 5, 'text-clipping': 'line' }]
const LF = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 0, 'text-padding': 5, 'text-clipping': 'line'
}]
const DTG_LINE = '(w || w1) ? (w ? w : "") + "—" + (w1 ? w1 : "") : null'
const ALT_LINE = '(x || x1) ? (x ? x : "") + "—" + (x1 ? x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 't', 'h', ALT_LINE, DTG_LINE]
  : ['t', 'h', ALT_LINE, DTG_LINE]

styles['MultiPoint:G*F*ATC---'] = styles['MultiPoint:CIRCLE'] // CIRCULAR TARGET
styles['MultiPoint:G*F*ACSC--'] = styles['MultiPoint:CIRCLE'] // FIRE SUPPORT AREA (FSA)
styles['MultiPoint:G*F*ACAC--'] = styles['MultiPoint:CIRCLE'] // AIRSPACE COORDINATION AREA (ACA)
styles['MultiPoint:G*F*ACFC--'] = styles['MultiPoint:CIRCLE'] // FREE FIRE AREA (FFA)
styles['MultiPoint:G*F*ACNC--'] = styles['MultiPoint:FILLED-CIRCLE'] // NO-FIRE AREA (NFA)
styles['MultiPoint:G*F*ACRC--'] = styles['MultiPoint:CIRCLE'] // RESTRICTIVE FIRE AREA (RFA)
styles['MultiPoint:G*F*ACPC--'] = styles['MultiPoint:CIRCLE'] // POSITION AREA FOR ARTILLERY (PAA)
styles['MultiPoint:G*F*ACEC--'] = styles['MultiPoint:CIRCLE'] // SENSOR ZONE
styles['MultiPoint:G*F*ACDC--'] = styles['MultiPoint:CIRCLE'] // DEAD SPACE AREA (DA)
styles['MultiPoint:G*F*ACZC--'] = styles['MultiPoint:CIRCLE'] // ZONE OF RESPONSIBILITY (ZOR)
styles['MultiPoint:G*F*ACBC--'] = styles['MultiPoint:CIRCLE'] // TARGET BUILD-UP AREA (TBA)
styles['MultiPoint:G*F*ACVC--'] = styles['MultiPoint:CIRCLE'] // TARGET VALUE AREA (TVAR)
styles['MultiPoint:G*F*AKBC--'] = styles['MultiPoint:FILLED-CIRCLE'] // KILL BOX/BLUE
styles['MultiPoint:G*F*AKPC--'] = styles['MultiPoint:FILLED-CIRCLE'] // KILL BOX/PURPLE

styles['LABELS:G*F*ATC---'] = C(ALL_LINES())
styles['LABELS:G*F*ACSC--'] = C(ALL_LINES('FSA'))
styles['LABELS:G*F*ACAC--'] = C(ALL_LINES('ACA'))
styles['LABELS:G*F*ACFC--'] = C(ALL_LINES('FFA'))
styles['LABELS:G*F*ACNC--'] = C(ALL_LINES('NFA'), HALO)
styles['LABELS:G*F*ACRC--'] = C(ALL_LINES('RFA'))
styles['LABELS:G*F*ACPC--'] = B('"PAA"')
styles['LABELS:G*F*ACEC--'] = C(ALL_LINES('SENSOR ZONE'))
styles['LABELS:G*F*ACDC--'] = C(ALL_LINES('DA'))
styles['LABELS:G*F*ACZC--'] = C(ALL_LINES('ZOR'))
styles['LABELS:G*F*ACBC--'] = C(ALL_LINES('TBA'))
styles['LABELS:G*F*ACVC--'] = C(ALL_LINES('TVAR'))
styles['LABELS:G*F*AKBC--'] = C(ALL_LINES('BKB'), HALO)
styles['LABELS:G*F*AKPC--'] = C(ALL_LINES('PKB'), HALO)
