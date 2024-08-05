export default (rbush, event) => {
  switch (event.type) {
    case 'insert': rbush.insert(event.item); break
    case 'remove': rbush.remove(event.item, event.equals); break
  }
  return rbush
}
