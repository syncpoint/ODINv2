import assert from 'assert'
import { isEnabled } from './environment'

describe('environment isEnabled', function () {
  it('return default=false if not set', function () {
    const value = isEnabled('TEST_SELF_UPDATE', false)
    assert.equal(value, false)
  })

  it('return default=true if not set', function () {
    const value = isEnabled('TEST_SELF_UPDATE', true)
    assert.equal(value, true)
  })

  it('return true if value=TRUE', function () {
    process.env.TEST_SELF_UPDATE = 'true'
    const value = isEnabled('TEST_SELF_UPDATE', false)
    assert.equal(value, true)
  })

  it('return true if value=1', function () {
    process.env.TEST_SELF_UPDATE = '1'
    const value = isEnabled('TEST_SELF_UPDATE', false)
    assert.equal(value, true)
  })

  it('return true if value=FALSE', function () {
    process.env.TEST_SELF_UPDATE = 'false'
    const value = isEnabled('TEST_SELF_UPDATE', true)
    assert.equal(value, false)
  })

  it('return true if value=0', function () {
    process.env.TEST_SELF_UPDATE = '0'
    const value = isEnabled('TEST_SELF_UPDATE', true)
    assert.equal(value, false)
  })
})
