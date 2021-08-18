import * as style from 'ol/style'
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

export const fenceX = ([point, angle, displacement]) => new style.Style({
  geometry: TS.point(point),
  image: new style.RegularShape({
    stroke: new style.Stroke({ color: 'black', width: 3 }),
    points: 4,
    radius: 8,
    radius2: 0,
    angle: Math.PI / 4,
    rotation: Math.PI - angle,
    scale: [1, 1.4],
    displacement: displacement || [0, 0]
  })
})

export const fenceO = ([point, angle, displacement]) => new style.Style({
  geometry: TS.point(point),
  image: new style.RegularShape({
    stroke: new style.Stroke({ color: 'black', width: 3 }),
    points: 8,
    radius: 8,
    radius2: 8,
    angle: Math.PI / 4,
    rotation: Math.PI - angle,
    scale: [0.8, 1.4],
    displacement: displacement || [0, 0]
  })
})

export const fenceDoubleX = ([point, angle]) => [
  new style.Style({
    geometry: TS.point(point),
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: Math.PI / 4,
      rotation: Math.PI - angle,
      scale: [1, 1.4],
      displacement: [-10, 0]
    })
  }),
  new style.Style({
    geometry: TS.point(point),
    image: new style.RegularShape({
      stroke: new style.Stroke({ color: 'black', width: 3 }),
      points: 4,
      radius: 8,
      radius2: 0,
      angle: Math.PI / 4,
      rotation: Math.PI - angle,
      scale: [1, 1.4],
      displacement: [10, 0]
    })
  })
]

export const fenceLine = geometry => new style.Style({
  geometry,
  stroke: new style.Stroke({ color: 'black', width: 3 })
})
