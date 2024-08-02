import * as R from 'ramda'
import * as ID from '../../ids'
import { select } from '../../../shared/signal'
import isCandidateId from './isCandidateId'

const selectEvent = select([
  R.propEq(ID.defaultStyleId, 'key'),
  R.compose(ID.isLayerStyleId, R.prop('key')),
  R.compose(ID.isFeatureStyleId, R.prop('key')),
  R.compose(isCandidateId, R.prop('key'))
])

export default selectEvent
