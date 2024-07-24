import * as TS from '../ts'
import * as Math from '../../../shared/Math'

export default (geometry, resolution) => ({ TS, ...Math, geometry, resolution })
