/* eslint-disable no-multi-spaces */

import G_F_AXC from './G_F_AXC'
import G_G_DLP from './G_G_DLP'
import G_G_OAS from './G_G_OAS'
import G_M_NM from './G_M_NM'
import G_T_E from './G_T_E'
import G_T_O from './G_T_O'
import G_T_Q from './G_T_Q'
import G_T_S from './G_T_S'
import fanLike from './G_T_Ux'

const circle = id => ({ TS, geometry }) => {
  const [C, A] = TS.coordinates(geometry)
  const segment = TS.segment([C, A])
  const buffer = TS.pointBuffer(TS.point(C))(segment.getLength())
  return [{ id, geometry: buffer }]
}

const CIRCLE = circle('style:2525c/default-stroke')
const FILLED_CIRCLE = circle('style:2525c/hatch-fill')

export default {
  DEFAULT: ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }],
  CIRCLE,
  FILLED_CIRCLE,
  'G*F*AXC---': G_F_AXC,        // SENSOR RANGE FAN
  'G*G*DLP---': G_G_DLP,        // PRINCIPLE DIRECTION OF FIRE
  'G*G*OAS---': G_G_OAS,        // SUPPORT BY FIRE POSITION
  'G*M*NM----': G_M_NM,         // MINIMUM SAFE DISTANCE ZONES
  'G*T*E-----': G_T_E,          // TASKS / ISOLATE
  'G*T*O-----': G_T_O,          // TASKS / OCCUPY
  'G*T*Q-----': G_T_Q,          // TASKS / RETAIN
  'G*T*S-----': G_T_S,          // TASKS / SECURE
  'G*T*US----': fanLike('"S"'), // TASKS / SCREEN
  'G*T*UG----': fanLike('"G"'), // TASKS / GUARD
  'G*T*UC----': fanLike('"C"'), // TASKS / COVER
  'G*G*GAS---': fanLike(null),  // SEARCH/RECONNAISSANCE AREA

  'G*F*ATC---': CIRCLE,         // CIRCULAR TARGET
  'G*F*ACSC--': CIRCLE,         // FIRE SUPPORT AREA (FSA)
  'G*F*ACAC--': CIRCLE,         // AIRSPACE COORDINATION AREA (ACA)
  'G*F*ACFC--': CIRCLE,         // FREE FIRE AREA (FFA)
  'G*F*ACNC--': FILLED_CIRCLE,  // NO-FIRE AREA (NFA)
  'G*F*ACRC--': CIRCLE,         // RESTRICTIVE FIRE AREA (RFA)
  'G*F*ACPC--': CIRCLE,         // POSITION AREA FOR ARTILLERY (PAA)
  'G*F*ACEC--': CIRCLE,         // SENSOR ZONE
  'G*F*ACDC--': CIRCLE,         // DEAD SPACE AREA (DA)
  'G*F*ACZC--': CIRCLE,         // ZONE OF RESPONSIBILITY (ZOR)
  'G*F*ACBC--': CIRCLE,         // TARGET BUILD-UP AREA (TBA)
  'G*F*ACVC--': CIRCLE,         // TARGET VALUE AREA (TVAR)
  'G*F*AKBC--': FILLED_CIRCLE,  // KILL BOX/BLUE
  'G*F*AKPC--': FILLED_CIRCLE   // KILL BOX/PURPLE
}
