
/**
 * updateRBush :: Rbush -> { type: 'noop' }
 * updateRBush :: Rbush -> { type: 'insert', item }
 * updateRBush :: Rbush -> { type: 'remove', item, equals }
 */
const updateRBush = (rbush, event) => {
  switch (event.type) {
    case 'insert': rbush.insert(event.item); break
    case 'remove': rbush.remove(event.item, event.equals); break
  }
  return rbush
}

export default updateRBush
