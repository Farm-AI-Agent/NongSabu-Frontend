const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status || 0
    this.code = options.code || null
    this.payload = options.payload || null
  }
}

function buildUrl(path) {
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {}, token } = options
  const requestHeaders = new Headers(headers)
  const isFormData = body instanceof FormData

  if (!isFormData && body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || '요청 처리에 실패했습니다.', {
      status: response.status,
      code: payload?.code,
      payload,
    })
  }

  return payload?.data ?? null
}
