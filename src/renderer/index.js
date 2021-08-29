// import './wdyr'
import ReactDOM from 'react-dom'
import 'antd/dist/antd.css'
import './index.css'
import { splash } from './components/Splash'
import { workspace } from './components/Workspace'

// Clipboard events: Handlers must evaluate target element to determin context.
document.addEventListener('copy', event => console.log('[index] copy', event))
document.addEventListener('cut', event => console.log('[index] cut', event))
document.addEventListener('paste', event => console.log('[index] paste', event))

const page = (() => {
  const entry = process.argv.find(s => s.startsWith('--page='))
  if (entry) return entry.split('=')[1]
})()


const projectUUID = page => page.split(':')[1]
const app = page === 'splash'
  ? splash()
  : workspace(projectUUID(page))

const container = document.createElement('div')
document.body.appendChild(container)
ReactDOM.render(app, container)
