import { ipcRenderer } from 'electron'
import ProjectStore from '../store/ProjectStore'
import { Selection } from '../Selection'
import { MatrixClient } from '@syncpoint/matrix-client-api'

export default () => {
  const services = {}

  services.ipcRenderer = ipcRenderer
  services.projectStore = new ProjectStore(ipcRenderer)
  services.selection = new Selection()
  services.replicationProvider = (process.env.MATRIX_HOME_SERVER_URL && process.env.MATRIX_USER_ID && process.env.MATRIX_PASSWORD
    ? MatrixClient({
      homeServerUrl: process.env.MATRIX_HOME_SERVER_URL,
      userId: process.env.MATRIX_USER_ID,
      password: process.env.MATRIX_PASSWORD,
      deviceId: 'PROJECT-LIST'
    })
    : {
        disabled: true
      }
  )
  return services
}
