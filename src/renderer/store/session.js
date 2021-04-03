import sublevel from 'subleveldown'
import level from './level'
import * as L from '../../shared/level'

const defaultViewport = {
  center: [1823376.75753279, 6143598.472197734], // Vienna
  resolution: 612,
  rotation: 0
}

export default (project = level()) => {
  const tuples = sublevel(project, 'tuples', { valueEncoding: 'json' })

  return {

    /**
     * Interface is compatible with ol/View constructor options.
     *
     * session:viewport: {
     *   center: [longitude/λ, latitude/φ] - Web Mercator,
     *   zoom: Number - map zoom (for legacy projects only),
     *   resolution: Number - map resolution (preferred over zoom),
     *   rotation: Number - map rotation (radians, not normalized)
     * }
     */
    getViewport: () => L.get(tuples, 'session:viewport', defaultViewport),


    /**
     * Note: resolution is used in favor of zoom.
     *
     * session:viewport: {
     *   center: [longitude/λ, latitude/φ] - Web Mercator,
     *   resolution: Number - map resolution (preferred over zoom),
     *   rotation: Number - map rotation (radians, not normalized)
     * }
     */
    putViewport: viewport => tuples.put('session:viewport', viewport)
  }
}
