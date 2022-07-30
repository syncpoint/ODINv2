// import './wdyr'
import React from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/antd.css'
import 'typeface-roboto'
import './index.css'
import { App } from './components/App'

const container = document.createElement('div')
container.id = 'main'
document.body.appendChild(container)

const root = createRoot(container)
root.render(<App/>)
