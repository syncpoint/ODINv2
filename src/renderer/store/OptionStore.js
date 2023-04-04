import feature from './options/feature'
import layer from './options/layer'
import link from './options/link'
import symbol from './options/symbol'
import marker from './options/marker'
import tileService from './options/tile-service'
import bookmark from './options/bookmark'
import place from './options/place'
import measure from './options/measure'
import invited from './options/invited'

export default function OptionStore (coordinatesFormat, store, sessionStore) {
  this.coordinatesFormat = coordinatesFormat
  this.store = store
  this.sessionStore = sessionStore
}

OptionStore.prototype.feature = feature
OptionStore.prototype.layer = layer
OptionStore.prototype.link = link
OptionStore.prototype['link+layer'] = OptionStore.prototype.link
OptionStore.prototype['link+feature'] = OptionStore.prototype.link
OptionStore.prototype.symbol = symbol
OptionStore.prototype.marker = marker
OptionStore.prototype['tile-service'] = tileService
OptionStore.prototype.bookmark = bookmark
OptionStore.prototype.place = place
OptionStore.prototype.measure = measure
OptionStore.prototype.invited = invited
