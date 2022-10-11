import feature from './documents/feature'
import layer from './documents/layer'
import link from './documents/link'
import symbol from './documents/symbol'
import marker from './documents/marker'
import tileService from './documents/tile-service'
import bookmark from './documents/bookmark'
import place from './documents/place'
import measure from './documents/measure'

export default function DocumentStore (store) {
  this.store = store
}

DocumentStore.prototype.feature = feature
DocumentStore.prototype.layer = layer
DocumentStore.prototype.link = link
DocumentStore.prototype['link+layer'] = DocumentStore.prototype.link
DocumentStore.prototype['link+feature'] = DocumentStore.prototype.link
DocumentStore.prototype.symbol = symbol
DocumentStore.prototype.marker = marker
DocumentStore.prototype.measure = measure
DocumentStore.prototype['tile-service'] = tileService
DocumentStore.prototype.bookmark = bookmark
DocumentStore.prototype.place = place
