import * as React from 'react'
import * as authNetflix from '../utils/authNetflixProvider'
import {clientAuth, clientNetFlix} from '../utils/clientApi'
import {useFetchData} from '../utils/hooks'
import {useQueryClient} from 'react-query'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
// 🐶 importe le hook  'useClearHistory'

const AuthContext = React.createContext()

const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth() s'utilise avec <AuthContext.provider>")
  }
  return context
}

async function getUserByToken() {
  let user = null
  const token = await authNetflix.getToken()
  if (token) {
    const data = await clientAuth('me', {token})
    user = data.data.user
  }
  return user
}

const AuthProvider = props => {
  const queryclient = useQueryClient()
  const {data: authUser, execute, status, setData} = useFetchData()
  // 🐶 utilise 'useClearHistory' pour avoir accès à 'clearHistory'
  React.useEffect(() => {
    execute(getUserByToken())
  }, [execute])

  const [authError, setAuthError] = React.useState()
  const login = data =>
    authNetflix
      .login(data)
      .then(user => setData(user))
      .catch(err => setAuthError(err))
  const register = data =>
    authNetflix
      .register(data)
      .then(user => setData(user))
      .catch(err => setAuthError(err))
  const logout = () => {
    authNetflix.logout()
    queryclient.clear()
    // 🐶 appelle la fonction 'clearHistory'
    setData(null)
  }
  if (status === 'fetching' || status === 'idle') {
    return (
      <Backdrop open={true}>
        <CircularProgress color="primary" />
      </Backdrop>
    )
  }
  if (status === 'done') {
    const value = {authUser, login, register, logout, authError}
    return <AuthContext.Provider value={value} {...props} />
  }
  throw new Error('status invalide')
}

const useClientNetflix = () => {
  const {
    authUser: {token},
  } = useAuth()
  return (endpoint, data) => clientNetFlix(endpoint, {...data, token})
}

export {AuthContext, useAuth, AuthProvider, useClientNetflix}