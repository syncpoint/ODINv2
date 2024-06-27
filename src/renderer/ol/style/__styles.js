import Signal from '@syncpoint/signal'
import { Polygon } from './__Polygon'
import { LineString } from './__LineString'
import { Point } from './__Point'
import { style } from './__style'

const other = feature => feature.$style = Signal.of(style())

export const styles = {
  Polygon,
  LineString,
  Point,
  other
}
