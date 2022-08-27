/* eslint-disable no-multi-spaces */
/* eslint-disable camelcase */

import namedCorridor from './G_G_ALx' // AVIATION / LINES
import G_G_OAF from './G_G_OAF'
import G_G_OLAA from './G_G_OLAA'
import G_G_OLAGM from './G_G_OLAGM'
import G_G_OLAGS from './G_G_OLAGS'
import G_G_OLAR from './G_G_OLAR'
import G_G_OLI from './G_G_OLI'
import G_G_PA from './G_G_PA'
import G_G_SLA from './G_G_SLA'
import G_M_BCA from './G_M_BCA'
import G_M_BCD from './G_M_BCD'
import G_M_BCE from './G_M_BCE'
import G_M_BDD from './G_M_BDD'
import G_M_BDE from './G_M_BDE'
import G_M_BDI from './G_M_BDI'
import G_M_OEB from './G_M_OEB'
import G_M_ORA from './G_M_ORA'
import G_M_ORC from './G_M_ORC'
import G_M_ORP from './G_M_ORP'
import G_M_ORS from './G_M_ORS'
import G_T_B from './G_T_B'
import G_T_C from './G_T_C'
import G_T_H from './G_T_H'
import G_T_J from './G_T_J'
import G_T_K from './G_T_K'
import G_T_KF from './G_T_KF'
import withdrawLike from './G_T_L' // TASKS / DELAY, RETIREMENT, WITHDRAW (UNDER PRESSURE)
import G_T_P from './G_T_P'
import G_T_R from './G_T_R'
import G_T_T from './G_T_T'
import G_T_X from './G_T_X'
import G_T_Y from './G_T_Y'

export default {
  DEFAULT: ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }],
  ERROR: ({ TS, geometry }) => {
    const [lineString, point] = TS.geometries(geometry)
    const width = TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
    const buffer = TS.lineBuffer(lineString)(width)
    return [{ id: 'style:wasp-stroke', geometry: buffer }]
  },
  'G*G*ALC---': namedCorridor('AC'),    // AIR CORRIDOR
  'G*G*ALM---': namedCorridor('MRR'),   // MINIMUM RISK ROUTE (MRR)
  'G*G*ALS---': namedCorridor('SAAFR'), // STANDARD-USE ARMY AIRCRAFT FLIGHT ROUTE (SAAFR)
  'G*G*ALU---': namedCorridor('UA'),    // UNMANNED AIRCRAFT (UA) ROUTE
  'G*G*ALL---': namedCorridor('LLTR'),  // LOW LEVEL TRANSIT ROUTE (LLTR)
  'G*G*OAF---': G_G_OAF,                // ATTACK BY FIRE POSITION
  'G*G*OLAA--': G_G_OLAA,               // AXIS OF ADVANCE / AIRBORNE
  'G*G*OLAGM-': G_G_OLAGM,              // AXIS OF ADVANCE / MAIN ATTACK
  'G*G*OLAGS-': G_G_OLAGS,              // AXIS OF ADVANCE / SUPPORTING ATTACK
  'G*G*OLAR--': G_G_OLAR,               // AXIS OF ADVANCE / ATTACK, ROTARY WING
  'G*G*OLAV--': G_G_OLAA,               // AXIS OF ADVANCE / AVIATION
  'G*G*OLI---': G_G_OLI,                // INFILTRATION LANE
  'G*G*PA----': G_G_PA,                 // AXIS OF ADVANCE FOR FEINT
  'G*G*SLA---': G_G_SLA,                // AMBUSH
  'G*M*BCA---': G_M_BCA,                // ASSAULT CROSSING AREA
  'G*M*BCB---': G_M_BCA,                // CROSSING SITE/WATER CROSSING / BRIDGE OR GAP
  'G*M*BCD---': G_M_BCD,                // FORD DIFFICULT
  'G*M*BCE---': G_M_BCE,                // FORD EASY
  'G*M*BDD---': G_M_BDD,                // BYPASS DIFFICULT
  'G*M*BDE---': G_M_BDE,                // BYPASS EASY
  'G*M*BDI---': G_M_BDI,                // BYPASS IMPOSSIBLE
  'G*M*OEB---': G_M_OEB,                // OBSTACLE EFFECT / BLOCK
  'G*M*OFG---': G_M_BCA,                // MINEFIELDS / GAP
  'G*M*ORA---': G_M_ORA,                // BLOWN BRIDGES / ARMED-BUT PASSABLE
  'G*M*ORC---': G_M_ORC,                // BLOWN BRIDGES / EXECUTED
  'G*M*ORP---': G_M_ORP,                // BLOWN BRIDGES / PLANNED
  'G*M*ORS---': G_M_ORS,                // BLOWN BRIDGES / SAFE
  'G*T*B-----': G_T_B,                  // TASKS / BLOCK
  'G*T*C-----': G_T_C,                  // TASKS / CANALIZE
  'G*T*H-----': G_T_H,                  // TASKS / BREACH
  'G*T*J-----': G_T_J,                  // TASKS / CONTAIN
  'G*T*K-----': G_T_K,                  // COUNTERATTACK (CATK)
  'G*T*KF----': G_T_KF,                 // COUNTERATTACK BY FIRE
  'G*T*L-----': withdrawLike('"D"'),    // TASKS / DELAY
  'G*T*M-----': withdrawLike('"R"'),    // TASKS / RETIREMENT
  'G*T*W-----': withdrawLike('"W"'),    // TASKS / WITHDRAW
  'G*T*WP----': withdrawLike('"WP"'),   // WITHDRAW UNDER PRESSURE
  'G*T*P-----': G_T_P,                  // TASKS / PENETRATE
  'G*T*R-----': G_T_R,                  // TASKS / RELIEF IN PLACE (RIP)
  'G*T*T-----': G_T_T,                  // TASKS / DISRUPT
  'G*T*X-----': G_T_X,                  // TASKS / CLEAR
  'G*T*Y-----': G_T_Y                   // TASKS / BYPASS
}
