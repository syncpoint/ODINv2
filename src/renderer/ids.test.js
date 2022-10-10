import assert from 'assert'
import * as ID from './ids'

const assertFeatureId = s => {
  const [scope, uuids] = s.split(ID.COLON)
  const [layerUUID, featureUUID] = uuids.split(ID.SLASH)
  assert.equal(scope, ID.FEATURE)
  assert(ID.isUUID(layerUUID))
  assert(ID.isUUID(featureUUID))
}

describe('ids', function () {

  it('scope :: Id -> String', function () {
    const scope = 'xyz'
    const id = ID.makeId(scope, '0815')
    assert.equal(ID.scope(id), scope)
  })

  it('ids :: Id -> String', function () {
    const uuids = '0815/4711'
    const id = ID.makeId('xyz', uuids)
    assert.equal(ID.ids(id), uuids)
  })

  it('nthId :: String -> String', function () {
    assert.equal(ID.nthId(0, 'scope:0815'), '0815')
    assert.equal(ID.nthId(0, 'scope:0815/4711'), '0815')
    assert.equal(ID.nthId(1, 'scope:0815/4711'), '4711')
  })

  it('layerUUID :: FeatureId -> UUID', function () {
    assert.equal(ID.layerUUID('feature:20/10'), '20')
  })

  it('layerUUID :: LayerId -> UUID', function () {
    assert.equal(ID.layerUUID('layer:10'), '10')
  })

  it('() -> LayerId', function () {
    const [scope, uuid] = ID.layerId().split(ID.COLON)
    assert.equal(scope, ID.LAYER)
    assert(ID.isUUID(uuid))
  })

  it('FeatureId -> LayerId', function () {
    const layerId = ID.layerId()
    const featureId = ID.featureId(layerId)
    assert.equal(ID.layerId(featureId), layerId)
  })

  it('LayerId -> LayerId', function () {
    const layerId = ID.layerId()
    assert.equal(ID.layerId(layerId), layerId)
  })

  it('...+LayerId -> LayerId', function () {
    const layerId = ID.layerId()
    const id = ID.prefix('XYZ')(layerId)
    assert.equal(ID.layerId(id), layerId)
  })

  it('...+FeatureId -> FeatureId', function () {
    const layerId = ID.layerId()
    const featureId = ID.featureId(layerId)
    const id = ID.prefix('XYZ')(featureId)
    assert.equal(ID.featureId(id), featureId)
  })

  it('LayerId -> FeatureId', function () {
    const layerId = ID.layerId()
    assertFeatureId(ID.featureId(layerId))
  })

  it('() -> MarkerId', function () {
    const [scope, uuid] = ID.markerId().split(ID.COLON)
    assert.equal(scope, ID.MARKER)
    assert(ID.isUUID(uuid))
  })

  it('() -> BookmarkId', function () {
    const [scope, uuid] = ID.bookmarkId().split(ID.COLON)
    assert.equal(scope, ID.BOOKMARK)
    assert(ID.isUUID(uuid))
  })

  it('Id -> LinkId', function () {
    const [scope, ids] = ID.linkId('layer:0817').split(ID.COLON)
    const [layerId, linkId] = ids.split(ID.SLASH)
    assert.equal(scope, 'link+layer')
    assert.equal(layerId, '0817')
    assert(ID.isUUID(linkId))
  })
})
