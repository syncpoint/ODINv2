import { ipcRenderer } from 'electron'
import ProjectStore from '../store/ProjectStore'
import { Selection } from '../Selection'
import { MatrixClient } from '@syncpoint/matrix-client-api'

export default async () => {
  const services = {}

  services.ipcRenderer = ipcRenderer
  services.projectStore = new ProjectStore(ipcRenderer)
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
