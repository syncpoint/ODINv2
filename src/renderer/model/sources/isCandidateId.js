import * as ID from '../../ids'

const isCandidateId =
  id =>
    ID.isFeatureId(id) ||
    ID.isMarkerId(id) ||
    ID.isMeasureId(id)

export default isCandidateId
