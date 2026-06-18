import { ApiError, apiRequest } from './api'

const POLICY_PROGRAM_ENDPOINTS = [
  '/api/v1/policies/recommendations',
  '/api/v1/policy/recommendations',
  '/api/v1/policies',
  '/api/v1/policy-programs',
  '/api/v1/support-programs',
]

const POLICY_ONBOARDING_ENDPOINTS = [
  '/api/v1/policy-onboarding/me',
  '/api/v1/policy-profiles/me',
  '/api/v1/policies/onboarding',
  '/api/v1/policy/recommendation-profile',
]

function isMissingEndpoint(error) {
  return error instanceof ApiError && [403, 404, 405, 500].includes(error.status)
}

async function requestFirstAvailable(endpoints, options) {
  let lastError = null

  for (const endpoint of endpoints) {
    try {
      return {
        endpoint,
        data: await apiRequest(endpoint, options),
      }
    } catch (error) {
      lastError = error

      if (!isMissingEndpoint(error)) {
        throw error
      }
    }
  }

  throw new ApiError('정책 API 경로를 찾지 못했습니다. 백엔드 최신 반영 여부를 확인해주세요.', {
    status: lastError?.status || 404,
    code: lastError?.code || 'POLICY_API_NOT_FOUND',
    payload: lastError?.payload || null,
  })
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value.content)) return value.content
  if (Array.isArray(value.items)) return value.items
  if (Array.isArray(value.programs)) return value.programs
  if (Array.isArray(value.policies)) return value.policies
  if (Array.isArray(value.recommendations)) return value.recommendations
  return []
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
}

function normalizeList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  return String(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toMoneyText(program) {
  return pick(
    program.subsidy,
    program.supportAmount,
    program.support_amount,
    program.amount,
    program.maxAmount,
    program.max_amount,
    program.budget,
    program.budgetAmount,
  )
}

export function parseMoneyValue(value) {
  if (!value) return 0

  const text = String(value).replace(/,/g, '')
  const matches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(조|억|천만|백만|만)?/g)]

  if (!matches.length) {
    return Number(text.replace(/[^\d.]/g, '')) || 0
  }

  return matches.reduce((sum, match) => {
    const num = Number(match[1])
    const unit = match[2]
    const multiplier = {
      조: 1000000000000,
      억: 100000000,
      천만: 10000000,
      백만: 1000000,
      만: 10000,
    }[unit] || 1

    return sum + num * multiplier
  }, 0)
}

export function parseDateValue(value) {
  if (!value) return Number.MAX_SAFE_INTEGER

  const text = String(value).trim()
  const normalized = text
    .replace(/년|\.|\//g, '-')
    .replace(/월/g, '-')
    .replace(/일/g, '')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/-$/g, '')

  const timestamp = Date.parse(normalized)
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

export function normalizePolicyProgram(program, index = 0) {
  const sourceSite = pick(program.sourceSite, program.source_site, program.source, program.site, program.organization)
  const deadline = pick(program.deadline, program.deadlineDate, program.deadline_date, program.endDate, program.end_date)
  const subsidy = toMoneyText(program)

  return {
    id: pick(program.id, program.policyId, program.policy_id, program.programId, program.program_id, index),
    name: pick(program.name, program.title, program.policyName, program.policy_name, program.programName, '이름 없는 지원사업'),
    category: pick(program.category, program.supportType, program.support_type, program.type, '정책'),
    crop: pick(program.crop, program.cropName, program.crop_name, program.primaryCropName, '전체'),
    subsidy: subsidy || '금액 정보 없음',
    amountValue: parseMoneyValue(subsidy),
    deadline: deadline || '마감일 정보 없음',
    deadlineValue: parseDateValue(deadline),
    sourceSite: sourceSite || '출처 미확인',
    description: pick(program.description, program.summary, program.content, program.overview, '상세 설명이 없습니다.'),
    requirements: normalizeList(pick(program.requirements, program.eligibility, program.condition, program.conditions)),
    benefits: normalizeList(pick(program.benefits, program.supportDetails, program.support_details, program.details)),
    contact: pick(program.contact, program.contactInfo, program.contact_info, program.department, '문의처 정보 없음'),
    applicationUrl: pick(program.applicationUrl, program.application_url, program.url, program.sourceUrl, program.source_url),
    original: program,
    liked: false,
  }
}

export async function fetchPolicyPrograms(token) {
  const result = await requestFirstAvailable(POLICY_PROGRAM_ENDPOINTS, {
    token,
  })

  return {
    endpoint: result.endpoint,
    programs: asArray(result.data).map(normalizePolicyProgram),
  }
}

export async function savePolicyOnboarding(payload, token) {
  let lastError = null

  for (const endpoint of POLICY_ONBOARDING_ENDPOINTS) {
    for (const method of ['POST', 'PUT']) {
      try {
        return {
          endpoint,
          data: await apiRequest(endpoint, {
            method,
            body: payload,
            token,
          }),
        }
      } catch (error) {
        lastError = error

        if (!isMissingEndpoint(error)) {
          throw error
        }
      }
    }
  }

  throw new ApiError('정책 온보딩 API 경로를 찾지 못했습니다. 백엔드 최신 반영 여부를 확인해주세요.', {
    status: lastError?.status || 404,
    code: lastError?.code || 'POLICY_ONBOARDING_API_NOT_FOUND',
    payload: lastError?.payload || null,
  })
}
