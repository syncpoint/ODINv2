import { OSM } from 'ol/source'
import { Tile as TileLayer } from 'ol/layer'

export default () => {
  // http://localhost:8000/services
  // http://localhost:8000/services/omk50_33
  // http://localhost:8000/services/omk50_33/tiles/{z}/{x}/{y}.jpg
  // const source = new XYZ({ url: 'http://localhost:8000/services/omk50_33/tiles/{z}/{x}/{y}.jpg' })
  const source = new OSM()
  const tileLayer = new TileLayer({ source })
  tileLayer.setOpacity(0.75)

  return [tileLayer]
}
