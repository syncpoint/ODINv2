/**
 * Stateful equality function to compare old/new keys of OL features/geometries.
 */
const keyequals = () => {
  const key = target => `${target.ol_uid}:${target.getRevision()}`
  let last
  return (_, b) => {
    if (last === key(b)) return true
    else last = key(b)
    return false
  }
}

export default keyequals
