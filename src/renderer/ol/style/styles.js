import Signal from '@syncpoint/signal'

export default feature => {
  const { $ } = feature

  return Signal.link(() => {
    return null
  }, [$.feature, $.centerResolution])
}
