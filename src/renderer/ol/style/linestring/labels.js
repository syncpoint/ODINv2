import { styles } from '../styles'

// Text with (white) outline.
const textStrokeWidth = 3

const TOP = -25
const BOTTOM = 25

const MT = text => [{ text, align: 0.5, offsetY: TOP }]
const MB = text => [{ text, align: 0.5, offsetY: BOTTOM }]
const MM = text => [{ text, align: 0.5, textStrokeWidth }]
const SE = text => ['start', 'end'].map(align => ({ text, align }))
const PL = title => ['start', 'end'].map(align => ({ text: [`"${title}"`, 't ? "(PL " + t + ")" : null'], align }))

const FSCL = [
  ['start', 'end'].map(align => ({ text: '"PL" + (t1 ? " " + t1 : "")', align })),
  ['left', 'right'].map(align => ({ text: '(t ? t + " " : "") + "FSCL"', align, offsetY: TOP })),
  ['left', 'right'].map(align => ({ text: ['w', 'w1'], align, offsetY: BOTTOM }))
]

const CFL = [
  ['start', 'end'].map(align => ({ text: '"PL" + (t1 ? " " + t1 : "")', align })),
  { text: '"CFL" + (t ? " " + t : "")', align: 0.5, offsetY: TOP },
  { text: ['w', 'w1'], align: 0.5, offsetY: BOTTOM }
]

const RFL = [
  ['start', 'end'].map(align => ({ text: '"PL" + (t1 ? " " + t1 : "")', align })),
  ['left', 'right'].map(align => ({ text: '"RFL" + (t ? " " + t  : "")', align, offsetY: TOP })),
  ['left', 'right'].map(align => ({ text: ['w', 'w1'], align, offsetY: BOTTOM }))
]

const MFP = [
  { text: '"MFP"', align: 0.5, textStrokeWidth },
  { text: ['w', 'w1'], align: 'left', offsetY: BOTTOM }
]

styles['LABELS:LINE_STRING'] = []
styles['LABELS:G*T*A-----'] = [{ text: 't', align: 0.15 }] // FOLLOW AND ASSUME
styles['LABELS:G*T*AS----'] = [{ text: 't', align: 0.15 }] // FOLLOW AND SUPPORT
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
