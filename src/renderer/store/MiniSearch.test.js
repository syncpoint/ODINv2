import assert from 'assert'
import { createIndex, parseQuery } from './MiniSearch'
import * as _default from './data/MiniSearch.default'
import * as _3OSC from './data/MiniSearch.3OSC'

describe('MiniSearch', function () {
  describe('default', function () {

    const reverseLookup = Object.keys(_default.fixture)
      .reduce((acc, key) => {
        acc[_default.fixture[key]] = key
        return acc
      }, {})

    const index = createIndex()
    index.addAll(_default.docs)

    const verify = (terms, expected) => () => {
      const [query] = parseQuery(terms)
      const actual = index.search(query)
        .map(({ id }) => reverseLookup[id])
        .sort()
        .join('')

      assert.deepStrictEqual(actual, expected)
    }

    it(" 1. - '1'", verify('1', 'ABCHJ'))
    it(" 2. - '1.'", verify('1.', 'A'))
    it(" 3. - '1/'", verify('1/', 'BCHJ'))
    it(" 4. - 'Inf'", verify('Inf', 'ABCDEFG'))
    it(" 5. - 'InfBn'", verify('InfBn', 'ABD'))
    it(" 6. - '53'", verify('53', 'ABCDGHIJP'))
    it(" 7. - '/53'", verify('/53', 'CHIJ'))
    it(" 8. - 'JgB'", verify('JgB', 'GP'))
    it(" 9. - '88'", verify('88', 'IKO'))
    it("10. - 'CP III'", verify('CP III', 'K'))
    it("11. - 'Check'", verify('Check', 'KL'))
    it("12. - 'PL'", verify('PL', 'MN'))
    it("13. - 'zu'", verify('zu', 'HI'))
    it("14. - '\"'", verify('"', 'MN'))
    it("15. - 'Boun'", verify('Boun', 'HIJ'))
    it("16. - 'Unit'", verify('Unit', 'ABCDEFG'))
    it("17. - '#Control'", verify('#Control', 'HIJKLMNOP'))
    it("18. - '#Eny'", verify('#Eny', 'JKO'))
    it("19. - '#ukn'", verify('#ukn', 'L'))
  })

  describe('issues', function () {
    it("MIP Scenario - '@feature #unit 3osc'", function () {
      const index = createIndex()
      index.addAll(_3OSC.docs)
      const [query] = parseQuery('@feature #unit 3osc')
      const actual = index.search(query)
      assert.strictEqual(actual.length, _3OSC.docs.length - 1) // minus one installation
    })
  })
})
