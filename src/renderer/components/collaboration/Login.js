import React from 'react'
import { useServices } from '../hooks'
import { HttpAPI } from '@syncpoint/matrix-client-api/src/http-api.mjs'
import { discover } from '@syncpoint/matrix-client-api'
import Icon from '@mdi/react'
import { mdiAccount, mdiKey, mdiHomeAccount } from '@mdi/js'
import './collaboration.css'

export const Login = () => {
  const { projectStore } = useServices()
  const [userId, setUserId] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [homeServerUrl, setHomeServerUrl] = React.useState('')
  const [writeProtected, setWriteProtected] = React.useState(false)

  const [validating, setValidating] = React.useState(false)
  const [error, setError] = React.useState(undefined)


  React.useEffect(() => {
    const getCredentials = async () => {
      const credentials = await projectStore.getCredentials('default')
      if (credentials) {
        setUserId(credentials.user_id)
        setHomeServerUrl(credentials.home_server_url)
        setPassword(credentials.password)
      }
    }
    getCredentials()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const detectHomeServerUrl = async () => {
    if (userId?.indexOf(':') === -1) return

    setHomeServerUrl('')
    try {
      const result = await discover({ user_id: userId })
      if (result?.home_server_url) {
        setHomeServerUrl(result.home_server_url)
        setWriteProtected(true)
      } else {
        console.warn(`Failed to detect server url for ${userId}: ${result}`)
        setWriteProtected(false)
      }
    } catch (error) {
      setWriteProtected(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setValidating(true)

    if (!userId || !password || !homeServerUrl) {
      setError('Sorry, but all fields are required!')
      setValidating(false)
      return
    }

    setError(undefined)

    try {
      const credentials = {
        home_server_url: homeServerUrl,
        user_id: userId,
        password,
        device_id: 'ODIN'
      }
      await HttpAPI.loginWithPassword(credentials)
      await projectStore.putCredentials('default', credentials)
      window.odin.collaboration.reloadAllWindows()
      window.odin.window.refreshMenu()
      window.odin.window.close('login')

    } catch (error) {
      if (error.response?.status === 403) {
        setError('Invalid username or password')
      } else if (error.response?.status === 429) {
        setError('Rate limiting does not allow you to login. Please try again later.')
      } else {
        setError(error.message ?? 'Login failed')
      }
    }
    setValidating(false)
  }

  return (
    <div className='collaboration_container'>
      <form className='login_form'>
        <p>Please use your <em>existing</em> [matrix] credentials to log in and you will be able to share your projects and get invited to join others.</p>
        <div >
          <Icon path={mdiAccount} size={1.5} htmlFor='userId' className='login_img'/>
          <input
            className='login_input'
            id='userId'
            value={userId}
            placeholder="@userId:your.server.com"
            required
            onChange={event => setUserId(event.target.value)}
            onBlur={detectHomeServerUrl}
          />
        </div>
        <div >
          <Icon path={mdiKey} size={1.5} htmlFor='password' className='login_img' />
          <input
            className='login_input'
            id='password'
            type='password'
            autoComplete='off'
            value={password}
            placeholder="Password"
            required
            onChange={ev => setPassword(ev.target.value)}
          />
        </div>
        <div>
          <Icon path={mdiHomeAccount} size={1.5} htmlFor='homeServerUrl' className='login_img'/>
          <input
            className='login_input'
            id='homeServerUrl'
            value={homeServerUrl}
            placeholder="[matrix] homeserver url"
            required
            onChange={ev => setHomeServerUrl(ev.target.value)}
            disabled={writeProtected}
          />
        </div>
        <div>
          <button
            className='login_button'
            type="submit"
            onClick={handleSubmit}
            disabled={validating}
            >
              SIGN IN
          </button>
        </div>
      </form>
      { error && <div className='login_feedback'>{error}</div> }
    </div>
  )
}

