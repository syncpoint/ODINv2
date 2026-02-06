import * as ID from '../../ids'

export default ({ replicatedProject, store, CREATOR_ID }) => async ({ operations, creatorId }) => {
  if (CREATOR_ID === creatorId) return
  console.dir(operations)

  /* helper */
  const sharedLayerIDs = async () => {
    const keys = await store.keys('shared+layer:')
    return store.tuples(keys.map(key => ID.layerId(key)))
  }

  const sharedLayersOnly = async (ops) => {
    const sharedLayers = (await sharedLayerIDs()).map(([key]) => key)
    return ops.filter(op => sharedLayers.includes(ID.layerId(ID.containerId(op.key))))
  }

  const structuralOperations = await sharedLayersOnly(operations.filter(op => ID.isLayerId(op.key)))
  /* LAYER RENAMED */
  structuralOperations
    .filter(op => op.type === 'put')
    .map(op => ({ id: op.key, name: op.value.name }))
    .forEach(op => replicatedProject.setLayerName(op.id, op.name))

  const predicates = [
    ID.isFeatureId,
    ID.isLinkId,
    ID.isTagsId,
    ID.isStyleId
  ]
  const operationsToBeReplicated = operations.filter(op => predicates.some(test => test(op.key)))

  const sharedContent = await sharedLayersOnly(operationsToBeReplicated)
  if (sharedContent.length) {
    console.dir(sharedContent)

    const operationsByLayer = sharedContent
      .filter(op => op !== null)
      .reduce((acc, op) => {
        const layerId = ID.layerId(ID.containerId(op.key))
        acc[layerId] = acc[layerId] || []
        acc[layerId].push(op)
        return acc
      }, {})

    Object.entries(operationsByLayer)
      .forEach(([layerId, operations]) => replicatedProject.post(layerId, operations))
  }
}
