const SESSION_KEY = 'fn_allege_session'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8h en ms

export function isAuthenticated() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { expires } = JSON.parse(raw)
    if (Date.now() > expires) {
      sessionStorage.removeItem(SESSION_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

export function login(inputPassword, envPassword) {
  if (inputPassword === envPassword) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      expires: Date.now() + SESSION_DURATION
    }))
    return true
  }
  return false
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}
