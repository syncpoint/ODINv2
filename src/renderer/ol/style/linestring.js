import * as MILSTD from '../../2525c'
import { styles } from './styles'

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
styles['TEXTS:G*T*A-----'] = [{ text: 't', textAlign: 0.2 }] // FOLLOW AND ASSUME
styles['TEXTS:G*T*AS----'] = [{ text: 't', textAlign: 0.2 }] // FOLLOW AND SUPPORT
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
  // TODO: simplify geometry depending on point count and resolution
  const { feature } = args
  const geometry = feature.getGeometry()
  if (!geometry.getCoordinates().length) return null

  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)

  return styles.FEATURE({
    geometry,
    properties: feature.getProperties(),
    strokes: styles['STROKES:DEFAULT'](sidc),
    texts: styles[`TEXTS:${key}`] || styles['TEXTS:LINE_STRING']
  })
}
