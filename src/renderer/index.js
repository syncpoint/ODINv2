// import './wdyr'
import ReactDOM from 'react-dom'
import React from 'react'
import 'antd/dist/antd.css'
import 'typeface-roboto'
import './index.css'
import { App } from './components/App'

// Clipboard events: Handlers must evaluate target element to determin context.
document.addEventListener('copy', event => console.log('[index] copy', event))
document.addEventListener('cut', event => console.log('[index] cut', event))
document.addEventListener('paste', event => console.log('[index] paste', event))


const container = document.createElement('div')
document.body.appendChild(container)
ReactDOM.render(<App/>, container)
