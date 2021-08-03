import * as MILSTD from '../../../2525c'
import { styles } from '../styles'
import './G_F_LT____' // LINEAR TARGET, FINAL PROTECTIVE FIRE (FPF) and LINEAR SMOKE TARGET
import './G_G_GLC___' // LINE OF CONTACT
import './G_G_GLF___' // FORWARD LINE OF OWN TROOPS (FLOT)
import './G_G_OLKA__' // DIRECTION OF ATTACK / AVIATION
import './G_G_OLKGM_' // DIRECTION OF ATTACK / MAIN ATTACK
import './G_G_OLKGS_' // DIRECTION OF ATTACK / SUPPORTING ATTACK
import './G_G_PF____' // DIRECTION OF ATTACK FOR FEINT
import './G_M_BCF___' // FERRY
import './G_M_BCL___' // LANE
import './G_M_BCR___' // RAFT SITE
import './G_M_OADx__' // ANTITANK DITCH / UNDER CONSTRUCTION and ... COMPLETE
import './G_M_OAR___' // ANTITANK DITCH REINFORCED WITH ANTITANK MINES
import './G_M_OEF___' // OBSTACLE EFFECT / FIX
import './G_M_OGL___' // OBSTACLES / GENERAL / LINE and ANTITANK WALL
import './G_M_OS____' // ABATIS
import './G_M_SL____' // FORTIFIED LINE
import './G_M_SW____' // FOXHOLE, EMPLACEMENT OR WEAPON SITE
import './G_O_HN____' // HAZARD / NAVIGATIONAL
import './G_S_LCH___' // HALTED CONVOY
import './G_S_LCM___' // MOVING CONVOY
import './G_T_A_____' // FOLLOW AND ASSUME
import './G_T_AS____' // FOLLOW AND SUPPORT
import './G_T_F_____' // TASKS / FIX

const MT = text => [{ text, textAlign: 0.5, verticalAlign: 'top' }]
const MB = text => [{ text, textAlign: 0.5, verticalAlign: 'bottom' }]
const MM = text => [{ text, textAlign: 0.5 }]
const SE = text => ['start', 'end'].map(textAlign => ({ text, textAlign }))
const PL = title => ['start', 'end'].map(textAlign => ({ text: [`"${title}"`, 't ? "(PL " + t + ")" : null'], textAlign }))

const FSCL = [
  ['start', 'end'].map(textAlign => ({ text: '"PL" + (t1 ? " " + t1 : "")', textAlign })),
  ['left', 'right'].map(textAlign => ({ text: '(t ? t + " " : "") + "FSCL"', textAlign, verticalAlign: 'top' })),
  ['left', 'right'].map(textAlign => ({ text: ['w', 'w1'], textAlign, verticalAlign: 'bottom' }))
]

const CFL = [
  ['start', 'end'].map(textAlign => ({ text: '"PL" + (t1 ? " " + t1 : "")', textAlign })),
  { text: '"CFL" + (t ? " " + t : "")', textAlign: 0.5, verticalAlign: 'top' },
  { text: ['w', 'w1'], textAlign: 0.5, verticalAlign: 'bottom' }
]

const RFL = [
  ['start', 'end'].map(textAlign => ({ text: '"PL" + (t1 ? " " + t1 : "")', textAlign })),
  ['left', 'right'].map(textAlign => ({ text: '"RFL" + (t ? " " + t  : "")', textAlign, verticalAlign: 'top' })),
  ['left', 'right'].map(textAlign => ({ text: ['w', 'w1'], textAlign, verticalAlign: 'bottom' }))
]

const MFP = [
  { text: '"MFP"', textAlign: 0.5 },
  { text: ['w', 'w1'], textAlign: 'left', verticalAlign: 'bottom' }
]

styles['TEXTS:LINE_STRING'] = []
styles['TEXTS:G*T*F-----'] = [{ text: '"F"', textAlign: 0.1 }] // TASKS / FIX
styles['TEXTS:G*T*A-----'] = [{ text: 't', textAlign: 0.15 }] // FOLLOW AND ASSUME
styles['TEXTS:G*T*AS----'] = [{ text: 't', textAlign: 0.15 }] // FOLLOW AND SUPPORT
styles['TEXTS:G*G*GLP---'] = SE('t ? "PL " + t : "PL"') // PHASE LINE
styles['TEXTS:G*G*GLL---'] = PL('LL') // LIGHT LINE
styles['TEXTS:G*G*PF----'] = MT('t') // DIRECTION OF ATTACK FOR FEINT
styles['TEXTS:G*G*DLF---'] = SE('"FEBA"') // FORWARD EDGE OF BATTLE AREA (FEBA)
styles['TEXTS:G*G*OLF---'] = PL('FINAL CL') // FINAL COORDINATION LINE
styles['TEXTS:G*G*OLL---'] = PL('LOA') // LIMIT OF ADVANCE
styles['TEXTS:G*G*OLT---'] = PL('LD') // LINE OF DEPARTURE
styles['TEXTS:G*G*OLC---'] = PL('LD/LC') // LINE OF DEPARTURE/LINE OF CONTACT (LD/LC)
styles['TEXTS:G*G*OLP---'] = PL('PLD') // PROBABLE LINE OF DEPLOYMENT (PLD)
styles['TEXTS:G*G*SLH---'] = SE('(t ? "PL " + t + "\n" : "") + "HOLDING LINE"') // HOLDING LINE
styles['TEXTS:G*G*SLR---'] = PL('RL') // RELEASE LINE
styles['TEXTS:G*G*SLB---'] = SE('(t ? "PL " + t + "\n" : "") + "BRIDGEHEAD LINE"') // BRIDGEHEAD
styles['TEXTS:G*F*LT----'] = MT('t') // LINEAR TARGET
styles['TEXTS:G*F*LTS---'] = [MT('t'), MB('"SMOKE"')] // LINEAR SMOKE TARGET
styles['TEXTS:G*F*LTF---'] = [MT('t'), MB('"FPF" + (t1 ? "\n" + t1 : "")')] // FINAL PROTECTIVE FIRE (FPF)
styles['TEXTS:G*F*LCF---'] = FSCL // FIRE SUPPORT COORDINATION LINE (FSCL)
styles['TEXTS:G*F*LCC---'] = CFL // COORDINATED FIRE LINE (CFL)
styles['TEXTS:G*F*LCN---'] = PL('NFL') // NO-FIRE LINE (NFL)
styles['TEXTS:G*F*LCR---'] = RFL // RESTRICTIVE FIRE LINE (RFL)
styles['TEXTS:G*F*LCM---'] = MFP // MUNITION FLIGHT PATH (MFP)
styles['TEXTS:G*S*LRM---'] = MT('"MSR" + (t ? " " + t : "")') // MAIN SUPPLY ROUTE
styles['TEXTS:G*S*LRA---'] = MT('"ASR" + (t ? " " + t : "")') // ALTERNATE SUPPLY ROUTE
styles['TEXTS:G*S*LRO---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ONE-WAY)"']) // MSR: ONE-WAY TRAFFIC
styles['TEXTS:G*S*LRT---'] = MT(['"MSR" + (t ? " " + t : "")', '"(ALTERNATING)"']) // MSR: ALTERNATING TRAFFIC
styles['TEXTS:G*S*LRW---'] = MT(['"MSR" + (t ? " " + t : "")', '"(TWO-WAY)"']) // MSR: TWO-WAY TRAFFIC
styles['TEXTS:G*O*B-----'] = MM('"B"') // BEARING LINE
styles['TEXTS:G*O*BE----'] = MM('"E"') // BEARING LINE / ELECTRONIC
styles['TEXTS:G*O*BA----'] = MM('"A"') // BEARING LINE / ACOUSTIC
styles['TEXTS:G*O*BT----'] = MM('"T"') // BEARING LINE / TORPEDO
styles['TEXTS:G*O*BO----'] = MM('"O"') // BEARING LINE / ELECTRO-OPTICAL INTERCEPT

styles.LineString = args => {
  const { feature, geometry } = args

  const style = () => {
    const sidc = feature.get('sidc')
    const key = MILSTD.parameterized(sidc)
    if (!key) return styles.DEFAULT()

    return styles[key]
      ? styles[key](args)
      : styles.FEATURE({
        geometry,
        properties: feature.getProperties(),
        strokes: styles['STROKES:DEFAULT'](sidc),
        texts: styles[`TEXTS:${key}`] || styles['TEXTS:LINE_STRING']
      })
  }

  // TODO: cache styles, beware resolution dependent features
  return style()
}
