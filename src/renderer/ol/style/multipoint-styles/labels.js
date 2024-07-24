const HALO = { 'text-clipping': 'none', 'text-halo-color': 'white', 'text-halo-width': 5 }
const C = (text, options) => [{ id: 'style:default-text', 'text-field': text, 'text-clipping': 'none', ...options }]
const B = text => [{ id: 'style:default-text', 'text-field': text, 'text-anchor': 'bottom', 'text-padding': 5, 'text-clipping': 'line' }]
const DTG_LINE = '(modifiers.w || modifiers.w1) ? (modifiers.w ? modifiers.w : "") + "—" + (modifiers.w1 ? modifiers.w1 : "") : null'
const ALT_LINE = '(modifiers.x || modifiers.x1) ? (modifiers.x ? modifiers.x : "") + "—" + (modifiers.x1 ? modifiers.x1 : "") : null'
const ALL_LINES = title => title
  ? [`"${title}"`, 'modifiers.t', 'modifiers.h', ALT_LINE, DTG_LINE]
  : ['modifiers.t', 'modifiers.h', ALT_LINE, DTG_LINE]

const labels = {
  'G*F*ATC---': C(ALL_LINES()),                // CIRCULAR TARGET
  'G*F*ACSC--': C(ALL_LINES('FSA')),           // FIRE SUPPORT AREA (FSA) CIRCULAR
  'G*F*ACAC--': C(ALL_LINES('ACA')),           // AIRSPACE COORDINATION AREA (ACA) CIRCULAR
  'G*F*ACFC--': C(ALL_LINES('FFA')),           // FREE FIRE AREA (FFA) CIRCULAR
  'G*F*ACNC--': C(ALL_LINES('NFA'), HALO),     // NO-FIRE AREA (NFA) CIRCULAR
  'G*F*ACRC--': C(ALL_LINES('RFA')),           // RESTRICTIVE FIRE AREA (RFA) CIRCULAR
  'G*F*ACPC--': B('"PAA"'),                    // POSITION AREA FOR ARTILLERY (PAA) CIRCULAR
  'G*F*ACEC--': C(ALL_LINES('SENSOR ZONE')),   // SENSOR ZONE CIRCULAR
  'G*F*ACDC--': C(ALL_LINES('DA')),            // DEAD SPACE AREA (DA) CIRCULAR
  'G*F*ACZC--': C(ALL_LINES('ZOR')),           // ZONE OF RESPONSIBILITY (ZOR) CIRCULAR
  'G*F*ACBC--': C(ALL_LINES('TBA')),           // TARGET BUILD-UP AREA (TBA) CIRCULAR
  'G*F*ACVC--': C(ALL_LINES('TVAR')),          // TARGET VALUE AREA (TVAR) CIRCULAR
  'G*F*AKBC--': C(ALL_LINES('BKB'), HALO),     // KILL BOX BLUE CIRCULAR
  'G*F*AKPC--': C(ALL_LINES('PKB'), HALO)      // KILL BOX PURPLE CIRCULAR
}

export default labels
