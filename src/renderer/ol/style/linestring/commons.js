import { codeUTM } from '../../../epsg'
import * as TS from '../../ts'

/**
 * Decorate existing style function with these cross-cutting concerns:
 * - in/call: project from web mercator to UTM (feature/geometry)
 * - in/call: convert feature geometry from OpenLayers to (J)TS
 * - in/call: forwards geometry as lineString (renamed)
 * - out/return: convert style geometry from (J)TS to OpenLayers
 * - out/return: project UTM to web mercator
 *
 * @param {function} fn original style function
 */
export const transform = fn => args => {
  const geometry = args.geometry || args.feature.getGeometry()
  const code = codeUTM(geometry)
  const clone = geometry.clone().transform('EPSG:3857', code)
  const styles = fn({ ...args, lineString: TS.read(clone) })
  if (!styles) return null

  return styles.flat()
    .map(style => {
      const geometry = TS.write(style.getGeometry())
      style.setGeometry(geometry.transform(code, 'EPSG:3857'))
      return style
    })
}
