import { styles } from '../styles'
import * as TS from '../../ts'
import * as MILSTD from '../../../symbology/2525c'

const echelons = {
  A: ['∅', 2 * 12.9111328125], // TEAM/CREW
  B: ['⦁', 2 * 6.8466796875], // SQUAD
  C: ['⦁ ⦁', 1.5 * 18.6943359375], // SECTION
  D: ['⦁ ⦁ ⦁', 30.5419921875], // PLATOON/DETACHMENT
  E: ['I', 2 * 5.0009765625], // COMPANY/BATTERY/TROOP
  F: ['I I', 1.5 * 15.0029296875], // BATALLION/SQUADRON
  G: ['I I I', 25.0048828125], // REGIMENT/GROUP
  H: ['X', 12.005859375], // BRIGADE
  I: ['X X', 29.0126953125], // DIVISION
  J: ['X X X', 46.01953125], // CORPS/MEF
  K: ['X X X X', 63.0263671875], // ARMY
  L: ['X X X X X', 80.033203125], // ARMY GROUP/FRONT
  M: ['X X X X X X', 97.0400390625], // REGION
  N: ['+ +', 26.0244140625] // COMMAND
}

// BOUNDARIES
styles['LineString:G*G*GLB---'] = ({ feature, styles, resolution, lineString }) => {
  const sidc = feature.get('sidc')
  const echelon = echelons[MILSTD.echelonCode(sidc)]
  const { stroke, text } = (() => {
    if (!echelon) return { stroke: lineString, text: null }

    const width = resolution * echelon[1] / 1.63
    const line = TS.lengthIndexedLine(lineString)
    const length = line.getEndIndex()
    const A = line.extractPoint(length / 2 - width)
    const B = line.extractPoint(length / 2 + width)
    const segment = TS.segment(A, B)

    const notch = TS.lineBuffer(TS.lineString([A, B]))(resolution * 10)
    const stroke = TS.difference([lineString, notch])

    const text = styles.text(TS.point(line.extractPoint(length / 2)), {
      text: echelon[0],
      flip: true,
      textAlign: () => 'center',
      rotation: Math.PI - segment.angle(),
      fontSize: '18px',
      fontWeight: 800,
      textStrokeWidth: 5,
      textStrokeColor: 'white'
    })

    return { stroke, text }
  })()

  return [
    styles.defaultStroke(stroke),
    ...(text ? [text] : [])
  ]
}

