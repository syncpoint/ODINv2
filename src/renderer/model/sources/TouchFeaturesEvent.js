import Event from 'ol/events/Event'

/**
 *
 */
export class TouchFeaturesEvent extends Event {
  constructor (keys) {
    super('touchfeatures')
    this.keys = keys
  }
}
