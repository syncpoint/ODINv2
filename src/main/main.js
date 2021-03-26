import { app } from 'electron'
import * as R from 'ramda'
import run from './application'

// Known warnings:
// Buffer() deprecation - node_modules/wkx/lib/binarywriter.js?:4:19 (PR: https://github.com/cschwarz/wkx/pull/42)
process.on('warning', warning => {
  console.log(warning.stack)
})

const quit = app.quit.bind(app)
const boot = R.cond([
  [R.equals(true), run],
  [R.T, quit]
])

const lockAcquired = app.requestSingleInstanceLock()
boot(lockAcquired)
