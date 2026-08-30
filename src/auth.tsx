import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken, type User } from './api'

interface Auth {
  user: User | null
  ready: boolean
  setUser: (u: User | null) => void
  signOut: () => void
}

const Ctx = createContext<Auth>({ user: null, ready: false, setUser: () => {}, signOut: () => {} })
export const useAuth = () => useContext(Ctx)

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(() => !getToken())

  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true))
  }, [])

  const signOut = () => {
    setToken(null)
    setUser(null)
  }

  const tree = <Ctx.Provider value={{ user, ready, setUser, signOut }}>{children}</Ctx.Provider>
  return CLIENT_ID ? <GoogleOAuthProvider clientId={CLIENT_ID}>{tree}</GoogleOAuthProvider> : tree
}

export function GoogleButton({ onError }: { onError: (m: string) => void }) {
  const { setUser } = useAuth()
  if (!CLIENT_ID) return <p className="muted">Google sign-in is not configured on this build.</p>
  return (
    <GoogleLogin
      onSuccess={async (cred) => {
        try {
          if (!cred.credential) throw new Error('no credential')
          const { token, user } = await api.signInWithGoogle(cred.credential)
          setToken(token)
          setUser(user)
        } catch (e) {
          onError(e instanceof Error ? e.message : 'sign-in failed')
        }
      }}
      onError={() => onError('Google sign-in was cancelled')}
      shape="pill"
      size="large"
      text="continue_with"
      width="280"
    />
  )
}
