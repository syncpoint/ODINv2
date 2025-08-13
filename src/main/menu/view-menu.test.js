import assert from 'assert'
import viewMenu from './view-menu.js'

describe('view-menu symbol properties item', () => {
  const findSymbolItem = (prefs = {}) => {
    const menu = viewMenu({ preferences: prefs })[0]
    const appearance = menu.submenu.find(item => item.label === 'Appearance')
    return appearance.submenu.find(item => item.label === 'Show Symbol Properties')
  }

  it('reflects preference state', () => {
    const unchecked = findSymbolItem({ 'ui.symbolProperties.showing': false })
    assert.strictEqual(unchecked.checked, false)

    const checked = findSymbolItem({ 'ui.symbolProperties.showing': true })
    assert.strictEqual(checked.checked, true)
  })

  it('sends VIEW_SYMBOL_PROPERTIES on click', () => {
    const item = findSymbolItem()
    let sent
    const browserWindow = { webContents: { send: (...args) => { sent = args } } }
    item.click({ checked: false }, browserWindow)
    assert.deepStrictEqual(sent, ['VIEW_SYMBOL_PROPERTIES', false])
  })
})
