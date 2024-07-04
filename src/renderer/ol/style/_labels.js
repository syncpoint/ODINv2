import polygonLabels from './polygon-styles/labels'
import lineStringLabels from './linestring-styles/labels'
import multiPointLabels from './multipoint-styles/labels'

const LABELS = {
  Polygon: polygonLabels,
  LineString: lineStringLabels,
  MultiPoint: multiPointLabels
}

export default (geometryType, sidc) => ((LABELS[geometryType] || {})[sidc] || []).flat()
