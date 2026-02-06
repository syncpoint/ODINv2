import assert from 'assert'
import { DateTime } from 'luxon'

describe('luxon (regression)', function () {

  it('DateTime.local :: () -> DateTime', function () {
    assert(DateTime.local() instanceof DateTime)
  })

  it('DateTime.toISO :: () -> DateTime', function () {
    const now = DateTime.local()
    const iso = now.toISO()
    const match = iso.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
    assert.strict(match[0], iso)
  })

  it('DateTime.from :: String -> DateTime', function () {
    const now = DateTime.local()
    const iso = now.toISO()
    const then = DateTime.fromISO(iso)
    assert(then instanceof DateTime)
  })

  it('DateTime.offset :: Number', function () {
    const now = DateTime.local()
    assert.strictEqual(typeof now.offset, 'number')
  })

  it('DateTime.toFormat :: String -> String', function () {
    const now = DateTime.local()
    const formatted = now.toFormat('ddHHmm--LLLyy')
    assert.strictEqual(typeof formatted, 'string')
  })
})
