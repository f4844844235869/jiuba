const ACCESS_TOKEN_KEY = "workspace.access_token"
const CURRENT_STORE_ID_KEY = "workspace.current_store_id"
const CURRENT_USER_KEY = "workspace.current_user"

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setStoredAccessToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearStoredAccessToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getStoredCurrentStoreId() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(CURRENT_STORE_ID_KEY)
}

export function setStoredCurrentStoreId(currentStoreId: string | null | undefined) {
  if (typeof window === "undefined") {
    return
  }

  if (!currentStoreId) {
    window.localStorage.removeItem(CURRENT_STORE_ID_KEY)
    return
  }

  window.localStorage.setItem(CURRENT_STORE_ID_KEY, currentStoreId)
}

export function clearStoredCurrentStoreId() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(CURRENT_STORE_ID_KEY)
}

export function getStoredCurrentUser<T>() {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    window.localStorage.removeItem(CURRENT_USER_KEY)
    return null
  }
}

export function setStoredCurrentUser<T>(currentUser: T | null | undefined) {
  if (typeof window === "undefined") {
    return
  }

  if (!currentUser) {
    window.localStorage.removeItem(CURRENT_USER_KEY)
    return
  }

  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser))
}

export function clearStoredCurrentUser() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(CURRENT_USER_KEY)
}
