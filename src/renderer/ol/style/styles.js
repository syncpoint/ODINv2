import Signal from '@syncpoint/signal'

export default feature => {
  const { $ } = feature

  return Signal.link(() => {
    console.log('[styles] preparing style...')
    return null
  }, [$.feature, $.centerResolution])
}
