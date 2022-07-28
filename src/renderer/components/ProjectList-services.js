import { ipcRenderer } from 'electron'
import ProjectStore from '../store/ProjectStore'
import { Selection } from '../Selection'

export default () => {
  const services = {}
  services.ipcRenderer = ipcRenderer
  services.projectStore = new ProjectStore(ipcRenderer)
  services.selection = new Selection()

  return services
}
