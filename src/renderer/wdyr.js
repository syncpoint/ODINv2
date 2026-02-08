import React from 'react'

if (window.odin.platform.isDevelopment) {
  console.log('injecting WDYR...')
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, {
    trackAllPureComponents: true
  })
}
