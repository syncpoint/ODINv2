/* eslint-disable no-multi-spaces */

import G_F_LT from './G_F_LT'
import G_G_GLC from './G_G_GLC'
import G_G_GLF from './G_G_GLF'
import G_G_OLKA from './G_G_OLKA'
import G_G_OLKGM from './G_G_OLKGM'
import G_G_OLKGS from './G_G_OLKGS'
import G_G_PF from './G_G_PF'
import G_M_BCF from './G_M_BCF'
import G_M_BCL from './G_M_BCL'
import G_M_BCR from './G_M_BCR'
import G_M_OADC from './G_M_OADC'
import G_M_OADU from './G_M_OADU'
import G_M_OAR from './G_M_OAR'
import G_M_OAW from './G_M_OAW'
import G_M_OEF from './G_M_OEF'
import G_M_OGL from './G_M_OGL'
import G_M_OMC from './G_M_OMC'
import G_M_OS from './G_M_OS'
import G_M_OWA from './G_M_OWA'
import G_M_OWCD from './G_M_OWCD'
import G_M_OWCS from './G_M_OWCS'
import G_M_OWCT from './G_M_OWCT'
import G_M_OWD from './G_M_OWD'
import G_M_OWH from './G_M_OWH'
import G_M_OWL from './G_M_OWL'
import G_M_OWS from './G_M_OWS'
import G_M_OWU from './G_M_OWU'
import G_M_SL from './G_M_SL'
import G_M_SW from './G_M_SW'
import G_O_HN from './G_O_HN'
import G_S_LCH from './G_S_LCH'
import G_S_LCM from './G_S_LCM'
import G_T_A from './G_T_A'
import G_T_AS from './G_T_AS'
import G_T_F from './G_T_F'

const DEFAULT = ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }]
const ERROR = ({ geometry }) => [{ id: 'style:wasp-stroke', geometry }]

export default {
  DEFAULT,
  ERROR,
  'G*F*LT----': G_F_LT,     // LINEAR TARGET
  'G*F*LTF---': G_F_LT,     // FINAL PROTECTIVE FIRE (FPF)
  'G*F*LTS---': G_F_LT,     // LINEAR SMOKE TARGET
  'G*G*GLC---': G_G_GLC,    // LINE OF CONTACT
  'G*G*GLF---': G_G_GLF,    // FORWARD LINE OF OWN TROOPS (FLOT)
  'G*G*OLKA--': G_G_OLKA,   // DIRECTION OF ATTACK / AVIATION
  'G*G*OLKGM-': G_G_OLKGM,  // DIRECTION OF ATTACK / MAIN ATTACK
  'G*G*OLKGS-': G_G_OLKGS,  // DIRECTION OF ATTACK / SUPPORTING ATTACK
  'G*G*PF----': G_G_PF,     // DIRECTION OF ATTACK FOR FEINT
  'G*M*BCF---': G_M_BCF,    // FERRY
  'G*M*BCL---': G_M_BCL,    // LANE
  'G*M*BCR---': G_M_BCR,    // RAFT SITE
  'G*M*OADC--': G_M_OADC,   // ANTITANK DITCH / COMPLETE
  'G*M*OADU--': G_M_OADU,   // ANTITANK DITCH / UNDER CONSTRUCTION
  'G*M*OAR---': G_M_OAR,    // ANTITANK DITCH REINFORCED WITH ANTITANK MINES
  'G*M*OEF---': G_M_OEF,    // OBSTACLE EFFECT / FIX
  'G*M*OAW---': G_M_OAW,    // ANTITANK WALL
  'G*M*OGL---': G_M_OGL,    // OBSTACLES / GENERAL / LINE
  'G*M*OMC---': G_M_OMC,    // MINE CLUSTER
  'G*M*OS----': G_M_OS,     // ABATIS
  'G*M*OWA---': G_M_OWA,    // DOUBLE APRON FENCE
  'G*M*OWCD--': G_M_OWCD,   // DOUBLE STRAND CONCERTINA
  'G*M*OWCS--': G_M_OWCS,   // SINGLE CONCERTINA
  'G*M*OWCT--': G_M_OWCT,   // TRIPLE STRAND CONCERTINA
  'G*M*OWD---': G_M_OWD,    // DOUBLE FENCE
  'G*M*OWH---': G_M_OWH,    // HIGH WIRE FENCE
  'G*M*OWL---': G_M_OWL,    // LOW WIRE FENCE
  'G*M*OWS---': G_M_OWS,    // SINGLE FENCE
  'G*M*OWU---': G_M_OWU,    // UNSPECIFIED FENCE
  'G*M*SL----': G_M_SL,     // FORTIFIED LINE
  'G*M*SW----': G_M_SW,     // FOXHOLE, EMPLACEMENT OR WEAPON SITE
  'G*O*HN----': G_O_HN,     // HAZARD / NAVIGATIONAL
  'G*S*LCH---': G_S_LCH,    // HALTED CONVOY
  'G*S*LCM---': G_S_LCM,    // MOVING CONVOY
  'G*T*A-----': G_T_A,      // FOLLOW AND ASSUME
  'G*T*AS----': G_T_AS,     // FOLLOW AND SUPPORT
  'G*T*F-----': G_T_F       // TASKS / FIX
}
