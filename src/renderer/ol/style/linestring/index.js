import { styles } from '../styles'
import { pipeline } from '../pipeline'

/* eslint-disable no-multi-spaces */
import './G_F_LT'    // LINEAR TARGET, FINAL PROTECTIVE FIRE (FPF) and LINEAR SMOKE TARGET
import './G_G_ALx'   // AVIATION / LINES
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

const ABOVE = -20
const BELOW = 20

const LEFT_END = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'end', 'text-offset': [-15, 0], 'text-padding': 5 }
const RIGHT_START = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'start', 'text-offset': [15, 0], 'text-padding': 5 }
const ABOVE_LEFT_START = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const ABOVE_RIGHT_END = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const BELOW_LEFT_START = { id: 'style:default-text', 'text-anchor': 'left', 'text-justify': 'start', 'text-padding': 5, 'text-offset': [0, BELOW] }
const BELOW_RIGHT_END = { id: 'style:default-text', 'text-anchor': 'right', 'text-justify': 'end', 'text-padding': 5, 'text-offset': [0, BELOW] }
const MT = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE], 'text-clipping': 'none' }]
const MB = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW], 'text-clipping': 'none' }]
const MM = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'center', 'text-padding': 5 }]
const SE = text => [LEFT_END, RIGHT_START].map(props => ({ 'text-field': text, ...props }))
const PL = title => [LEFT_END, RIGHT_START].map(props => ({ 'text-field': [`"${title}"`, 't ? "(PL " + t + ")" : null'], ...props }))
const FSCL_1 = [LEFT_END, RIGHT_START].map(props => ({ 'text-field': '"PL" + (t1 ? " " + t1 : "")', ...props }))
const FSCL_2 = [ABOVE_LEFT_START, ABOVE_RIGHT_END].map(props => ({ 'text-field': '(t ? t + " " : "") + "FSCL"', ...props }))
const FSCL_3 = [BELOW_LEFT_START, BELOW_RIGHT_END].map(props => ({ 'text-field': ['w', 'w1'], ...props }))
const FSCL = [FSCL_1, FSCL_2, FSCL_3]
const CFL_1 = [LEFT_END, RIGHT_START].map(props => ({ 'text-field': '"PL" + (t1 ? " " + t1 : "")', 'text-padding': 5, ...props }))
const CFL_2 = { id: 'style:default-text', 'text-field': '"CFL" + (t ? " " + t : "")', 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, ABOVE] }
const CFL_3 = { id: 'style:default-text', 'text-field': ['w', 'w1'], 'text-anchor': 'center', 'text-padding': 5, 'text-offset': [0, BELOW] }
const CFL = [CFL_1, CFL_2, CFL_3]
const RFL_2 = [ABOVE_LEFT_START, ABOVE_RIGHT_END].map(props => ({ 'text-field': '"RFL" + (t ? " " + t  : "")', ...props }))
const RFL = [FSCL_1, RFL_2, FSCL_3]
const MFP_1 = { id: 'style:default-text', 'text-field': '"MFP"', 'text-anchor': 'center', 'text-padding': 5 }
const MFP = [MFP_1, FSCL_3]

styles['LineString:DEFAULT'] = ({ geometry }) => [{ id: 'style:2525c/default-stroke', geometry }]
styles['LABELS:LINE_STRING'] = []
styles['LABELS:G*T*A-----'] = [{ id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND ASSUME
styles['LABELS:G*T*AS----'] = [{ id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.15, 'text-clipping': 'none' }] // FOLLOW AND SUPPORT
styles['LABELS:G*G*GLB---'] = [
  { id: 'style:default-text', 'text-field': 't', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, ABOVE] },
  { id: 'style:default-text', 'text-field': 't1', 'text-anchor': 0.5, 'text-clipping': 'none', 'text-offset': [0, BELOW] },
  { 'icon-image': 'echelon', 'icon-anchor': 0.5, 'icon-padding': 5 }
]
styles['LABELS:G*G*GLP---'] = SE('t ? "PL " + t : "PL"') // PHASE LINE
styles['LABELS:G*G*GLL---'] = PL('LL') // LIGHT LINE
styles['LABELS:G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
styles['LABELS:G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
styles['LABELS:G*G*OLF---'] = PL('FINAL CL') // FINAL COORDINATION LINE
styles['LABELS:G*G*OLL---'] = PL('LOA') // LIMIT OF ADVANCE
styles['LABELS:G*G*OLT---'] = PL('LD') // LINE OF DEPARTURE
styles['LABELS:G*G*OLC---'] = PL('LD/LC') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
styles['LABELS:G*G*OLP---'] = PL('PLD') // PROBABLE LINE OF DEPLOYMENT (PLD)
styles['LABELS:G*G*SLH---'] = SE('(t ? "PL " + t + "\n" : "") + "HOLDING LINE"') // HOLDING LINE
styles['LABELS:G*G*SLR---'] = PL('RL') // RELEASE LINE
styles['LABELS:G*G*SLB---'] = SE('(t ? "PL " + t + "\n" : "") + "BRIDGEHEAD LINE"') // BRIDGEHEAD
styles['LABELS:G*F*LT----'] = MT('t') // LINEAR TARGET
styles['LABELS:G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
styles['LABELS:G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
styles['LABELS:G*F*LCF---'] = FSCL // FIRE SUPPORT COORDINATION LINE (FSCL)
styles['LABELS:G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
styles['LABELS:G*F*LCN---'] = PL('NFL') // NO-FIRE LINE (NFL)
styles['LABELS:G*F*LCR---'] = RFL // RESTRICTIVE FIRE LINE (RFL)
styles['LABELS:G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
styles['LABELS:G*S*LRM---'] = MT('"MSR" + (t ? " " + t : "")') // MAIN SUPPLY ROUTE
styles['LABELS:G*S*LRA---'] = MT('"ASR" + (t ? " " + t : "")') // ALTERNATE SUPPLY ROUTE
styles['LABELS:G*S*LRO---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
styles['LABELS:G*S*LRT---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
styles['LABELS:G*S*LRW---'] = MT(['"MSR" + (t ? " " + t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
styles['LABELS:G*O*B-----'] = MM('"B"') // BEARING LINE
styles['LABELS:G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
styles['LABELS:G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
styles['LABELS:G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
styles['LABELS:G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT


/**
 *
 */
styles.LineString = options => {
  return pipeline(styles, options)
}
