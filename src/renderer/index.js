import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { App } from './components/App'

const app = document.createElement('div')
document.body.appendChild(app)
ReactDOM.render(<App/>, app)
