import ProjectStore from '../store/ProjectStore'
import { Selection } from '../Selection'
import { MatrixClient } from '@syncpoint/matrix-client-api'

export default async () => {
  const services = {}

  services.projectStore = new ProjectStore(window.odin.projects, window.odin.replication)
  services.selection = new Selection()

  const credentials = await services.projectStore.getCredentials('default')

  services.replicationProvider = credentials
    ? MatrixClient({
      ...credentials,
      device_id: 'PROJECT-LIST'
    })
    : {
        disabled: true
      }

  return services
}
