// import './wdyr'
import ReactDOM from 'react-dom'
import React from 'react'
import 'antd/dist/antd.css'
import 'typeface-roboto'
import './index.css'
import { App } from './components/App'

const container = document.createElement('div')
document.body.appendChild(container)
ReactDOM.render(<App/>, container)
