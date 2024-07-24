import { echelonCode } from '../../symbology/2525c'
import { echelons } from './echelon'
import { Jexl } from 'jexl'

const jexl = new Jexl()

/**
 *
 */
const evalSync = context => {
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, context)

  const replaceOne = properties => {
    properties = Array.isArray(properties) ? properties : [properties]
    return properties.reduce((acc, spec) => {
      if (!spec['text-field']) acc.push(spec)
      else {
        const textField = evalSync(spec['text-field'])
        if (textField) acc.push({ ...spec, 'text-field': textField })
      }

      return acc
    }, [])
  }

  const replaceAll = arg => {
    if (!Array.isArray(arg)) return replaceAll(arg)
    return arg.flatMap(replaceOne)
  }

  return replaceAll
}

export default (sidc, props1, props2) => {
  const code = echelonCode(sidc)
  const echelon =
    (code === '*' || code === '-')
      ? ''
      : echelons[code]?.text

  return evalSync({
    modifiers: { ...props1, ...props2 },
    echelon
  })
}
