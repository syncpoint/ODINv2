import * as R from 'ramda'

export default {
  colorScheme: R.prop('color-scheme'),

  circleFillColor: R.prop('circle-fill-color'),
  circleLineColor: R.prop('circle-line-color'),
  circleLineWidth: R.prop('circle-line-width'),
  circleRadius: R.prop('circle-radius'),

  fillColor: R.prop('fill-color'),
  fillPattern: R.prop('fill-pattern'),
  fillPatternAngle: R.prop('fill-pattern-angle'),
  fillPatternSize: R.prop('fill-pattern-size'),
  fillPatternSpacing: R.prop('fill-pattern-spacing'),

  iconAnchor: R.prop('icon-anchor'),
  iconHeight: R.prop('icon-height'),
  iconImage: R.prop('icon-image'),
  iconPadding: R.prop('icon-padding'),
  iconRotate: R.prop('icon-rotate'),
  iconScale: R.prop('icon-scale'),
  iconUrl: R.prop('icon-url'),
  iconWidth: R.prop('icon-width'),

  lineCap: R.prop('line-cap'),
  lineColor: R.prop('line-color'),
  lineDashArray: R.prop('line-dash-array'),
  lineHaloColor: R.prop('line-halo-color'),
  lineHaloDashArray: R.prop('line-halo-dash-array'),
  lineHaloWidth: R.prop('line-halo-width'),
  lineWidth: R.prop('line-width'),

  textAnchor: R.prop('text-anchor'),
  textClipping: R.prop('text-clipping'),
  textColor: R.prop('text-color'),
  textField: R.prop('text-field'),
  textFillColor: R.prop('text-fill-color'),
  textFont: R.prop('text-font'),
  textHaloColor: R.prop('text-halo-color'),
  textHaloWidth: R.prop('text-halo-width'),
  textJustify: R.prop('text-justify'),
  textLineColor: R.prop('text-line-color'),
  textLineWidth: R.prop('text-line-width'),
  textOffset: R.prop('text-offset'),
  textPadding: R.prop('text-padding'),
  textRotate: R.prop('text-rotate'),

  shapeAngle: R.prop('shape-angle'),
  shapeFillColor: R.prop('shape-fill-color'),
  shapeLineColor: R.prop('shape-line-color'),
  shapeLineWidth: R.prop('shape-line-width'),
  shapeOffset: R.prop('shape-offset'),
  shapePoints: R.prop('shape-points'),
  shapeRadius: R.prop('shape-radius'),
  shapeRadius1: R.prop('shape-radius-1'),
  shapeRadius2: R.prop('shape-radius-2'),
  shapeRotate: R.prop('shape-rotate'),
  shapeScale: R.prop('shape-scale'),

  symbolAnchor: R.prop('symbol-anchor'),
  symbolCode: R.prop('symbol-code'),
  symbolColor: R.prop('symbol-color'), // monoColor
  symbolFillOpacity: R.prop('symbol-fill-opacity'),
  symbolHaloColor: R.prop('symbol-halo-color'),
  symbolHaloWidth: R.prop('symbol-halo-width'),
  symbolLineWidth: R.prop('symbol-line-width'),
  symbolModifiers: R.prop('symbol-modifiers'),
  symbolOffset: R.prop('symbol-offset'),
  symbolRotate: R.prop('symbol-rotate'),
  symbolSize: R.prop('symbol-size'),
  symbolTextColor: R.prop('symbol-text-color'),
  symbolTextSize: R.prop('symbol-text-size')
}
