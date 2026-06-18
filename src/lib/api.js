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

  let response

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch (error) {
    throw new ApiError(`API 서버에 연결하지 못했습니다. 서버 주소(${API_BASE_URL})와 CORS 허용 포트를 확인해주세요.`, {
      status: 0,
      code: 'NETWORK_ERROR',
      payload: error,
    })
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok || payload?.success === false) {
    const fallbackMessage = response.status === 401 || response.status === 403
      ? '로그인이 만료되었거나 요청 권한이 없습니다. 다시 로그인해주세요.'
      : '요청 처리에 실패했습니다.'

    throw new ApiError(payload?.message || payload?.error || fallbackMessage, {
      status: response.status,
      code: payload?.code,
      payload,
    })
  }

  return payload?.data ?? null
}
