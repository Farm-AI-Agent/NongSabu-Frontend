import { ApiError, apiRequest } from './api'

const POLICY_PROGRAM_ENDPOINTS = [
  '/api/v1/support-programs?size=100',
  '/api/v1/policy-programs?size=100',
  '/api/v1/policies?size=100',
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

async function requestOrNull(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

async function requestArrayOrEmpty(path, options) {
  try {
    return (await requestOrNull(path, options)) || []
  } catch (error) {
    console.warn(`${path} 목록을 불러오지 못했습니다.`, error)
    return []
  }
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
  const lowerText = text.toLowerCase()

  if (/상시|연중|수시|예산|소진|미정|별도/.test(text)) {
    return Number.MAX_SAFE_INTEGER
  }

  const dDayMatch = lowerText.match(/d\s*-\s*(\d+)/)
  if (dDayMatch) {
    const date = new Date()
    date.setDate(date.getDate() + Number(dDayMatch[1]))
    date.setHours(23, 59, 59, 999)
    return date.getTime()
  }

  const compactDateMatches = [...text.matchAll(/(20\d{2})[.-/]?(\d{1,2})[.-/]?(\d{1,2})/g)]
  const compactDateMatch = compactDateMatches.at(-1)
  if (compactDateMatch) {
    const [, year, month, day] = compactDateMatch
    const timestamp = Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
  }

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

function formatCultivationArea(value) {
  const num = Number(value)

  if (!num || num <= 0 || Number.isNaN(num)) {
    return ''
  }

  const pyeong = Math.round((num / 3.3058) * 100) / 100
  return `${num}제곱미터 (${pyeong}평)`
}

function normalizeCropName(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase()
}

function findCropByName(cropList, cropName) {
  const normalizedName = normalizeCropName(cropName)

  if (!normalizedName) {
    return null
  }

  return cropList.find((crop) => normalizeCropName(crop.name) === normalizedName) || null
}

async function saveFarmProfile(token, payload) {
  try {
    return await apiRequest('/api/v1/farm-profiles/me', {
      method: 'PUT',
      token,
      body: payload,
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error
    }

    return apiRequest('/api/v1/farm-profiles/me', {
      method: 'POST',
      token,
      body: payload,
    })
  }
}

async function saveFarm(token, payload) {
  try {
    return await apiRequest('/api/v1/farms/me', {
      method: 'PUT',
      token,
      body: payload,
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error
    }

    return apiRequest('/api/v1/farms/me', {
      method: 'POST',
      token,
      body: payload,
    })
  }
}

export function normalizePolicyProgram(program, index = 0) {
  const sourceSite = pick(program.sourceSite, program.source_site, program.source, program.site, program.organization)
  const deadline = pick(
    program.deadline,
    program.deadlineDate,
    program.deadline_date,
    program.applicationPeriod,
    program.application_period,
    program.applyDeadline,
    program.apply_deadline,
    program.endDate,
    program.end_date,
  )
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
    description: pick(program.description, program.summary, program.content, program.overview, program.targetGroup, program.target_group, '상세 설명이 없습니다.'),
    requirements: normalizeList(pick(program.requirements, program.eligibility, program.condition, program.conditions, program.targetGroup, program.target_group)),
    benefits: normalizeList(pick(program.benefits, program.supportDetails, program.support_details, program.details, program.applyMethod, program.apply_method)),
    recommendationReason: pick(program.recommendationReason, program.recommendation_reason, program.matchReason, program.match_reason, program.reason),
    matchedCriteria: normalizeList(pick(program.matchedCriteria, program.matched_criteria, program.matchingFactors, program.matching_factors, program.matchedReasons)),
    contact: pick(program.contact, program.contactInfo, program.contact_info, program.department, '문의처 정보 없음'),
    applicationUrl: pick(program.applicationUrl, program.application_url, program.url, program.sourceUrl, program.source_url, program.detailUrl, program.detail_url),
    original: program,
    sortIndex: index,
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

export async function syncPolicyOnboardingToUserProfile(payload, token) {
  if (!token) {
    return { synced: false, reason: 'NO_TOKEN' }
  }

  const [farm, farmProfile, userCrops, cropList] = await Promise.all([
    requestOrNull('/api/v1/farms/me', { token }),
    requestOrNull('/api/v1/farm-profiles/me', { token }),
    requestArrayOrEmpty('/api/v1/user-crops/me', { token }),
    requestArrayOrEmpty('/api/v1/crops', { token }),
  ])

  const region = pick(payload.farmland_region, payload.residence_region, farmProfile?.region, farm?.location)
  const formattedFarmSize = formatCultivationArea(payload.cultivation_area)
  const farmSize = pick(formattedFarmSize, farmProfile?.farmSize, farm?.cultivationArea)
  const cropNames = [payload.primary_crop_name, ...(payload.secondary_crop_names || [])].filter(Boolean)
  const matchedCrops = cropNames
    .map((cropName) => findCropByName(cropList, cropName))
    .filter(Boolean)
  const currentCropIds = new Set((userCrops || []).map((item) => item.cropId))
  const primaryCrop = findCropByName(cropList, payload.primary_crop_name) || matchedCrops[0] || null
  const mainCropId = primaryCrop?.id || farmProfile?.mainCropId || matchedCrops[0]?.id || null

  if (region || farmSize || mainCropId) {
    await saveFarmProfile(token, {
      region,
      experienceLevel: farmProfile?.experienceLevel || 'BEGINNER',
      farmSize,
      mainCropId,
    })
  }

  if (region || farmSize) {
    await saveFarm(token, {
      name: farm?.name || (region ? `${region} 농장` : '나의 농장'),
      location: region,
      cultivationArea: farmSize,
      notes: farm?.notes || '',
    })
  }

  for (const crop of matchedCrops) {
    if (currentCropIds.has(crop.id)) {
      continue
    }

    await apiRequest('/api/v1/user-crops', {
      method: 'POST',
      token,
      body: {
        cropId: crop.id,
        cultivationArea: farmSize,
        memo: '정책 온보딩에서 자동 반영',
      },
    })
  }

  return {
    synced: true,
    region,
    farmSize,
    mainCropId,
    cropCount: matchedCrops.length,
  }
}
