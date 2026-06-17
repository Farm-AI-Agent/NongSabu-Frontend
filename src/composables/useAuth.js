import { ref } from 'vue'
import { ApiError, apiRequest } from '../lib/api'

const STORAGE_KEYS = {
  accessToken: 'fd_access_token',
  tokenType: 'fd_token_type',
  expiresAt: 'fd_access_token_expires_at',
  userName: 'fd_user_name',
  userEmail: 'fd_user_email',
}

const accessToken = ref(localStorage.getItem(STORAGE_KEYS.accessToken) || '')
const tokenType = ref(localStorage.getItem(STORAGE_KEYS.tokenType) || 'Bearer')
const userName = ref(localStorage.getItem(STORAGE_KEYS.userName) || '')
const userEmail = ref(localStorage.getItem(STORAGE_KEYS.userEmail) || '')
const loggedIn = ref(Boolean(accessToken.value))
const authReady = ref(false)

let initializationPromise = null

function setSession(session, member) {
  accessToken.value = session.accessToken
  tokenType.value = session.tokenType || 'Bearer'
  userName.value = member.name
  userEmail.value = member.email
  loggedIn.value = true

  localStorage.setItem(STORAGE_KEYS.accessToken, session.accessToken)
  localStorage.setItem(STORAGE_KEYS.tokenType, tokenType.value)
  localStorage.setItem(STORAGE_KEYS.userName, member.name)
  localStorage.setItem(STORAGE_KEYS.userEmail, member.email)

  if (session.expiresIn) {
    const expiresAt = Date.now() + session.expiresIn * 1000
    localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt))
  }
}

function clearSession() {
  accessToken.value = ''
  tokenType.value = 'Bearer'
  userName.value = ''
  userEmail.value = ''
  loggedIn.value = false

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}

function isTokenExpired() {
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expiresAt) || 0)
  return Boolean(expiresAt) && Date.now() >= expiresAt
}

async function fetchMyProfile(token = accessToken.value) {
  if (!token) {
    throw new ApiError('인증 토큰이 없습니다.')
  }

  return apiRequest('/api/v1/members/me', { token })
}

async function initializeAuth() {
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    if (!accessToken.value || isTokenExpired()) {
      clearSession()
      authReady.value = true
      return null
    }

    try {
      const member = await fetchMyProfile(accessToken.value)
      setSession(
        {
          accessToken: accessToken.value,
          tokenType: tokenType.value,
          expiresIn: Math.max(
            Math.floor((Number(localStorage.getItem(STORAGE_KEYS.expiresAt) || Date.now()) - Date.now()) / 1000),
            1,
          ),
        },
        member,
      )
      authReady.value = true
      return member
    } catch (error) {
      clearSession()
      authReady.value = true
      throw error
    }
  })()

  try {
    return await initializationPromise
  } finally {
    initializationPromise = null
  }
}

async function signup(payload) {
  return apiRequest('/api/v1/auth/signup', {
    method: 'POST',
    body: payload,
  })
}

async function login(credentials) {
  const session = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    body: credentials,
  })
  const member = await fetchMyProfile(session.accessToken)
  setSession(session, member)
  authReady.value = true
  return member
}

function logout() {
  clearSession()
  authReady.value = true
}

export function useAuth() {
  return {
    accessToken,
    tokenType,
    userName,
    userEmail,
    loggedIn,
    authReady,
    initializeAuth,
    signup,
    login,
    logout,
    fetchMyProfile,
  }
}
