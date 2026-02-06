export const KEYS = {
  STREAM_TOKEN: 'replication:streamToken',
  CREDENTIALS: 'replication:credentials',
  SEED: 'replication:seed'
}

export const rolesReducer = (acc, current) => {
  if (current.role.self === 'READER') {
    acc.restrict.push(current.id)
  } else {
    acc.permit.push(current.id)
  }
  return acc
}
