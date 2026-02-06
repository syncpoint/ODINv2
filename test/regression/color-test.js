import assert from 'assert'
import Color from 'color'

const input = ['white', 'black', 'red', 'brown', 'gold', 'green', 'blue', 'purple']

describe('Color (regression)', function () {
  it('Color :: Color c => String -> c', function () {
    const expected = [
      [ 255, 255, 255 ],
      [ 0, 0, 0 ],
      [ 255, 0, 0 ],
      [ 165, 42, 42 ],
      [ 255, 215, 0 ],
      [ 0, 128, 0 ],
      [ 0, 0, 255 ],
      [ 128, 0, 128 ]
    ]

    const actual = input.map(c => Color(c)).map(({ color }) => color)
    assert.deepStrictEqual(actual, expected)
  })

  it('rgb :: Color c => () => c', function () {
    const expected = [
      [ 255, 255, 255 ],
      [ 0, 0, 0 ],
      [ 255, 0, 0 ],
      [ 165, 42, 42 ],
      [ 255, 215, 0 ],
      [ 0, 128, 0 ],
      [ 0, 0, 255 ],
      [ 128, 0, 128 ]
    ]

    const actual = input.map(c => Color(c)).map(c => c.rgb()).map(({ color }) => color)
    assert.deepStrictEqual(actual, expected)
  })

  it('string :: () => String', function () {
    const expected = [
      'rgb(255, 255, 255)',
      'rgb(0, 0, 0)',
      'rgb(255, 0, 0)',
      'rgb(165, 42, 42)',
      'rgb(255, 215, 0)',
      'rgb(0, 128, 0)',
      'rgb(0, 0, 255)',
      'rgb(128, 0, 128)'
    ]

    const actual = input.map(c => Color(c)).map(c => c.rgb().string())
    assert.deepStrictEqual(actual, expected)
  })
})