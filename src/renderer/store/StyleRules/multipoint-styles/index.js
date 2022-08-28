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

export default {
  DEFAULT: ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }],
  CIRCLE: circle('style:2525c/default-stroke'),
  FILLED_CIRCLE: circle('style:2525c/hatch-fill'),
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
  'G*G*GAS---': fanLike(null)   // SEARCH/RECONNAISSANCE AREA

}

