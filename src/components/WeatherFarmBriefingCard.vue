<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import RegionPickerModal from './RegionPickerModal.vue'
import { ApiError, apiRequest } from '../lib/api'
import { fetchCurrentWeather } from '../lib/weather'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const DEFAULT_BRIEFING_PATH = '/api/v1/weather-farm-briefing'
const configuredBriefingPath = import.meta.env.VITE_FARM_BRIEFING_PATH || DEFAULT_BRIEFING_PATH
const briefingEndpointCandidates = [
  configuredBriefingPath,
  '/api/v1/farm-briefings/weather',
  '/api/v1/weather/farm-briefing',
].filter((path, index, self) => path && self.indexOf(path) === index)

const { accessToken } = useAuth()
const { farmLocation, hasFarmLocation, setFarmLocation } = useFarmProfileState()

const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref('')
const showRegionModal = ref(false)
const selectedCrops = ref([])
const farm = ref(null)
const farmProfile = ref(null)
const currentWeather = ref(null)
const briefing = ref(null)
const loadedRegion = ref('')

const regionLabel = computed(() => loadedRegion.value || (hasFarmLocation.value ? farmLocation.value : '지역 미설정'))
const cropLabel = computed(() => {
  if (!selectedCrops.value.length) {
    return '선택된 작물 없음'
  }

  return selectedCrops.value.map((crop) => crop.name).join(', ')
})

const weatherLabel = computed(() => {
  if (!currentWeather.value) {
    return '날씨 확인 전'
  }

  return `${currentWeather.value.temperature}°C · ${currentWeather.value.condition}`
})

function resolveErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
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

function normalizeList(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        return item?.text || item?.title || item?.content || item?.message || ''
      })
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|•|-/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeBriefing(data) {
  const source = data?.briefing || data?.farmBriefing || data || {}

  return {
    summary: source.summary || source.overview || source.message || '현재 날씨와 농장 정보를 바탕으로 브리핑을 준비했습니다.',
    actions: normalizeList(source.actions || source.actionItems || source.recommendedActions || source.todos),
    warnings: normalizeList(source.warnings || source.alerts || source.risks || source.cautions),
    generatedAt: source.generatedAt || source.createdAt || source.updatedAt || '',
  }
}

function buildBriefingPayload(forceRefresh) {
  const weather = currentWeather.value
  const crops = selectedCrops.value.map((crop) => ({
    id: crop.id,
    name: crop.name,
    cultivationArea: crop.cultivationArea || '',
  }))

  return {
    forceRefresh,
    region: loadedRegion.value,
    location: loadedRegion.value,
    farmName: farm.value?.name || '',
    farmSize: farmProfile.value?.farmSize || farm.value?.cultivationArea || '',
    experienceLevel: farmProfile.value?.experienceLevel || '',
    mainCropId: farmProfile.value?.mainCropId || crops[0]?.id || null,
    mainCropName: crops.find((crop) => crop.id === farmProfile.value?.mainCropId)?.name || crops[0]?.name || '',
    cropIds: crops.map((crop) => crop.id),
    cropNames: crops.map((crop) => crop.name),
    crops,
    currentWeather: weather,
    weather,
  }
}

async function requestBriefing(payload) {
  let lastError = null

  for (const path of briefingEndpointCandidates) {
    try {
      return await apiRequest(path, {
        method: 'POST',
        token: accessToken.value,
        body: payload,
      })
    } catch (error) {
      lastError = error

      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error
      }
    }
  }

  throw lastError || new ApiError('농장 브리핑 API를 찾지 못했습니다.')
}

async function loadFarmContext() {
  if (!accessToken.value) {
    selectedCrops.value = []
    farm.value = null
    farmProfile.value = null
    loadedRegion.value = hasFarmLocation.value ? farmLocation.value : ''
    return
  }

  const [loadedFarm, loadedFarmProfile, userCrops, cropList] = await Promise.all([
    requestOrNull('/api/v1/farms/me', { token: accessToken.value }),
    requestOrNull('/api/v1/farm-profiles/me', { token: accessToken.value }),
    apiRequest('/api/v1/user-crops/me', { token: accessToken.value }),
    apiRequest('/api/v1/crops', { token: accessToken.value }),
  ])

  farm.value = loadedFarm
  farmProfile.value = loadedFarmProfile
  loadedRegion.value = loadedFarmProfile?.region || loadedFarm?.location || (hasFarmLocation.value ? farmLocation.value : '')

  if (loadedRegion.value) {
    setFarmLocation(loadedRegion.value)
  }

  const cropsById = new Map((cropList || []).map((crop) => [crop.id, crop]))
  selectedCrops.value = (userCrops || []).map((item) => {
    const crop = cropsById.get(item.cropId)

    return {
      id: item.cropId,
      name: crop?.name || item.cropName || `작물 #${item.cropId}`,
      cultivationArea: item.cultivationArea || '',
    }
  })
}

async function loadBriefing({ forceRefresh = false, reloadContext = true } = {}) {
  errorMessage.value = ''

  if (reloadContext) {
    await loadFarmContext()
  }

  if (!loadedRegion.value) {
    currentWeather.value = null
    briefing.value = null
    isLoading.value = false
    return
  }

  currentWeather.value = await fetchCurrentWeather(loadedRegion.value)
  const payload = buildBriefingPayload(forceRefresh)
  const data = await requestBriefing(payload)
  briefing.value = normalizeBriefing(data)
}

async function loadInitialBriefing() {
  isLoading.value = true

  try {
    await loadBriefing({ forceRefresh: false })
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '농장 브리핑을 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

async function refreshBriefing() {
  isRefreshing.value = true

  try {
    await loadBriefing({ forceRefresh: true })
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '농장 브리핑을 새로고침하지 못했습니다.')
  } finally {
    isRefreshing.value = false
  }
}

async function saveRegion(region) {
  showRegionModal.value = false
  loadedRegion.value = region
  setFarmLocation(region)

  if (!accessToken.value) {
    return refreshBriefing()
  }

  let saveError = ''

  try {
    const payload = {
      region,
      experienceLevel: farmProfile.value?.experienceLevel || 'BEGINNER',
      farmSize: farmProfile.value?.farmSize || farm.value?.cultivationArea || '',
      mainCropId: farmProfile.value?.mainCropId || selectedCrops.value[0]?.id || null,
    }

    try {
      await apiRequest('/api/v1/farm-profiles/me', {
        method: 'PUT',
        token: accessToken.value,
        body: payload,
      })
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error
      }

      await apiRequest('/api/v1/farm-profiles/me', {
        method: 'POST',
        token: accessToken.value,
        body: payload,
      })
    }
  } catch (error) {
    saveError = resolveErrorMessage(error, '지역 저장에 실패했습니다.')
  }

  await refreshBriefing()

  if (saveError) {
    errorMessage.value = saveError
  }
}

onMounted(loadInitialBriefing)

watch(farmLocation, (nextLocation, previousLocation) => {
  if (!nextLocation || nextLocation === previousLocation || nextLocation === loadedRegion.value) {
    return
  }

  if (!hasFarmLocation.value) {
    loadedRegion.value = ''
    briefing.value = null
    currentWeather.value = null
    return
  }

  loadedRegion.value = nextLocation
  refreshBriefing()
})
</script>

<template>
  <section class="mb-6">
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-xs font-semibold text-brand mb-1">오늘의 농장 브리핑</div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">날씨에 맞춰 우선순위를 확인하세요</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="showRegionModal = true"
            class="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-brand-border hover:bg-brand-light transition-colors"
          >
            지역 선택
          </button>
          <button
            type="button"
            @click="refreshBriefing"
            class="px-3 py-2 bg-brand text-white rounded-lg text-xs font-medium hover:bg-opacity-90 disabled:opacity-60 transition-colors"
            :disabled="isLoading || isRefreshing || !loadedRegion"
          >
            {{ isRefreshing ? '새로고침 중' : '새로고침' }}
          </button>
        </div>
      </div>

      <div class="px-5 py-4 bg-slate-50 border-b border-gray-100 grid gap-3 md:grid-cols-3">
        <div>
          <div class="text-[11px] text-gray-500 mb-1">지역</div>
          <div class="text-sm font-semibold text-gray-900 truncate">{{ regionLabel }}</div>
        </div>
        <div>
          <div class="text-[11px] text-gray-500 mb-1">현재 날씨</div>
          <div class="text-sm font-semibold text-gray-900">{{ weatherLabel }}</div>
        </div>
        <div>
          <div class="text-[11px] text-gray-500 mb-1">자동 반영 작물</div>
          <div class="text-sm font-semibold text-gray-900 truncate">{{ cropLabel }}</div>
        </div>
      </div>

      <div v-if="isLoading" class="p-6 text-sm text-gray-500">
        현재 날씨와 농장 정보를 확인하는 중입니다...
      </div>

      <div v-else-if="!loadedRegion" class="p-6">
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div class="text-sm font-bold text-amber-900 mb-1">농장 지역이 필요합니다</div>
          <p class="text-sm text-amber-800 mb-4">마이페이지와 같은 선택 방식으로 지역을 지정하면 날씨와 작물 정보를 자동으로 묶어 브리핑을 요청합니다.</p>
          <button
            type="button"
            @click="showRegionModal = true"
            class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            지역 선택하기
          </button>
        </div>
      </div>

      <div v-else class="p-5">
        <div v-if="errorMessage" class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ errorMessage }}
        </div>

        <div class="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div class="rounded-lg border border-gray-200 bg-white p-5">
            <div class="text-xs font-semibold text-gray-500 mb-2">SUMMARY</div>
            <p class="text-[17px] leading-7 font-semibold text-gray-900">
              {{ briefing?.summary || '브리핑 결과를 기다리는 중입니다.' }}
            </p>
            <div v-if="briefing?.generatedAt" class="mt-4 text-xs text-gray-400">
              갱신: {{ briefing.generatedAt }}
            </div>
          </div>

          <div class="grid gap-4">
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div class="text-xs font-bold text-emerald-800 mb-3">ACTIONS</div>
              <ul v-if="briefing?.actions?.length" class="space-y-2">
                <li v-for="action in briefing.actions" :key="action" class="flex gap-2 text-sm text-emerald-950">
                  <span class="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600 flex-shrink-0"></span>
                  <span>{{ action }}</span>
                </li>
              </ul>
              <div v-else class="text-sm text-emerald-900">지금 바로 필요한 작업이 있으면 이곳에 표시됩니다.</div>
            </div>

            <div class="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div class="text-xs font-bold text-rose-800 mb-3">WARNINGS</div>
              <ul v-if="briefing?.warnings?.length" class="space-y-2">
                <li v-for="warning in briefing.warnings" :key="warning" class="flex gap-2 text-sm text-rose-950">
                  <span class="mt-1 h-1.5 w-1.5 rounded-full bg-rose-600 flex-shrink-0"></span>
                  <span>{{ warning }}</span>
                </li>
              </ul>
              <div v-else class="text-sm text-rose-900">특별한 경고가 없으면 이 영역은 비어 있습니다.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RegionPickerModal
      v-if="showRegionModal"
      @close="showRegionModal = false"
      @select="saveRegion"
    />
  </section>
</template>
