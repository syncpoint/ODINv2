import assert from 'assert'
import * as ID from '../../../src/renderer/ids'
import { clone } from '../../../src/renderer/model/Import'

describe('Import.clone', function () {

  describe('sse-service (live data source)', function () {

    it('rewrites the service key to a new id', async function () {
      const original = ID.sseServiceId()
      const entries = [[original, { name: 'Source', enabled: true }]]

      const tuples = await clone(null, entries)

      assert.equal(tuples.length, 1)
      const [key] = tuples[0]
      assert(ID.isSSEServiceId(key))
      assert.notEqual(key, original, 'must not overwrite the original service')
    })

    it('rewrites the associated tags key to the new service id', async function () {
      const original = ID.sseServiceId()
      const entries = [
        [original, { name: 'Source' }],
        [ID.tagsId(original), ['Live Data']]
      ]

      const tuples = await clone(null, entries)
      const map = Object.fromEntries(tuples)

      const newServiceKey = Object.keys(map).find(ID.isSSEServiceId)
      const tagsKey = Object.keys(map).find(k => k.startsWith('tags+'))
      assert.equal(tagsKey, ID.tagsId(newServiceKey), 'tags must follow the new service id')
      assert.deepEqual(map[tagsKey], ['Live Data'])
    })

    it('inserts the copy disabled', async function () {
      const entries = [[ID.sseServiceId(), { name: 'Source', enabled: true }]]

      const tuples = await clone(null, entries)

      assert.equal(tuples[0][1].enabled, false)
    })

    it('assigns the copy a fresh feature namespace', async function () {
      const original = ID.sseServiceId()
      const featureIdPrefix = 'feature:11111111-1111-1111-1111-111111111111/'
      const entries = [[original, { name: 'Source', featureIdPrefix }]]

      const tuples = await clone(null, entries)

      const value = tuples[0][1]
      assert.notEqual(value.featureIdPrefix, featureIdPrefix, 'must not share the original namespace')
      const uuid = value.featureIdPrefix.replace(/^feature:/, '').replace(/\/$/, '')
      assert(ID.isUUID(uuid), 'featureIdPrefix must reference a valid uuid')
    })

    it('does not mutate the original value', async function () {
      const value = { name: 'Source', enabled: true }
      const entries = [[ID.sseServiceId(), value]]

      await clone(null, entries)

      assert.equal(value.enabled, true)
    })
  })
})
