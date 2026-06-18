<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const { accessToken } = useAuth()
const { farmLocation, hasFarmLocation } = useFarmProfileState()

const selectedCrops = ref([])
const cropsLoading = ref(false)
const cropsError = ref('')
const weatherLoading = ref(false)
const weatherError = ref('')
const weather = ref({
  temp: '--',
  condition: '지역 설정 후 날씨를 확인할 수 있어요',
  icon: '🌤️',
  locationName: '',
})

const cropEmojiMap = {
  토마토: '🍅',
  딸기: '🍓',
  오이: '🥒',
  상추: '🥬',
  배추: '🥬',
  고추: '🌶️',
  당근: '🥕',
  옥수수: '🌽',
  포도: '🍇',
  배: '🍐',
  사과: '🍎',
  수박: '🍉',
  멜론: '🍈',
  양파: '🧅',
}

const detailedFallbackCoordinates = [
  { keyword: '서울 강남구', latitude: 37.5172, longitude: 127.0473, name: '서울 강남구' },
  { keyword: '서울 강동구', latitude: 37.5301, longitude: 127.1238, name: '서울 강동구' },
  { keyword: '서울 강북구', latitude: 37.6396, longitude: 127.0257, name: '서울 강북구' },
  { keyword: '서울 강서구', latitude: 37.5509, longitude: 126.8495, name: '서울 강서구' },
  { keyword: '서울 관악구', latitude: 37.4784, longitude: 126.9516, name: '서울 관악구' },
  { keyword: '서울 광진구', latitude: 37.5384, longitude: 127.0823, name: '서울 광진구' },
  { keyword: '서울 구로구', latitude: 37.4955, longitude: 126.8877, name: '서울 구로구' },
  { keyword: '서울 금천구', latitude: 37.4569, longitude: 126.8958, name: '서울 금천구' },
  { keyword: '서울 노원구', latitude: 37.6542, longitude: 127.0568, name: '서울 노원구' },
  { keyword: '서울 도봉구', latitude: 37.6688, longitude: 127.0471, name: '서울 도봉구' },
  { keyword: '서울 동대문구', latitude: 37.5744, longitude: 127.0396, name: '서울 동대문구' },
  { keyword: '서울 동작구', latitude: 37.5124, longitude: 126.9393, name: '서울 동작구' },
  { keyword: '서울 마포구', latitude: 37.5663, longitude: 126.9016, name: '서울 마포구' },
  { keyword: '서울 서대문구', latitude: 37.5791, longitude: 126.9368, name: '서울 서대문구' },
  { keyword: '서울 서초구', latitude: 37.4837, longitude: 127.0324, name: '서울 서초구' },
  { keyword: '서울 성동구', latitude: 37.5633, longitude: 127.0369, name: '서울 성동구' },
  { keyword: '서울 성북구', latitude: 37.5894, longitude: 127.0167, name: '서울 성북구' },
  { keyword: '서울 송파구', latitude: 37.5145, longitude: 127.1059, name: '서울 송파구' },
  { keyword: '서울 양천구', latitude: 37.5169, longitude: 126.8664, name: '서울 양천구' },
  { keyword: '서울 영등포구', latitude: 37.5264, longitude: 126.8962, name: '서울 영등포구' },
  { keyword: '서울 용산구', latitude: 37.5326, longitude: 126.9905, name: '서울 용산구' },
  { keyword: '서울 은평구', latitude: 37.6027, longitude: 126.9291, name: '서울 은평구' },
  { keyword: '서울 종로구', latitude: 37.5735, longitude: 126.9788, name: '서울 종로구' },
  { keyword: '서울 중구', latitude: 37.5641, longitude: 126.9979, name: '서울 중구' },
  { keyword: '서울 중랑구', latitude: 37.6063, longitude: 127.0927, name: '서울 중랑구' },
]

const regionFallbackCoordinates = [
  { keyword: '서울', latitude: 37.5665, longitude: 126.978, name: '서울' },
  { keyword: '부산', latitude: 35.1796, longitude: 129.0756, name: '부산' },
  { keyword: '대구', latitude: 35.8714, longitude: 128.6014, name: '대구' },
  { keyword: '인천', latitude: 37.4563, longitude: 126.7052, name: '인천' },
  { keyword: '광주', latitude: 35.1595, longitude: 126.8526, name: '광주' },
  { keyword: '대전', latitude: 36.3504, longitude: 127.3845, name: '대전' },
  { keyword: '울산', latitude: 35.5384, longitude: 129.3114, name: '울산' },
  { keyword: '경기', latitude: 37.4138, longitude: 127.5183, name: '경기' },
  { keyword: '강원', latitude: 37.8228, longitude: 128.1555, name: '강원' },
  { keyword: '충북', latitude: 36.8, longitude: 127.7, name: '충북' },
  { keyword: '충남', latitude: 36.5184, longitude: 126.8, name: '충남' },
  { keyword: '전북', latitude: 35.7175, longitude: 127.153, name: '전북' },
  { keyword: '전남', latitude: 34.8679, longitude: 126.991, name: '전남' },
  { keyword: '경북', latitude: 36.4919, longitude: 128.8889, name: '경북' },
  { keyword: '경남', latitude: 35.4606, longitude: 128.2132, name: '경남' },
  { keyword: '제주', latitude: 33.4996, longitude: 126.5312, name: '제주' },
]

function normalizeKoreanLocation(location) {
  return location.replace(/\s+/g, ' ').trim()
}

function findFallbackCoordinates(location, candidates = detailedFallbackCoordinates) {
  const normalized = normalizeKoreanLocation(location)
  return candidates.find((item) => normalized.includes(item.keyword))
}

async function searchOpenMeteoLocation(query, originalLocation) {
  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'ko',
    format: 'json',
  })
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const results = (data.results || []).filter((place) => place.country_code === 'KR')

  if (!results.length) {
    return null
  }

  const detailToken = normalizeKoreanLocation(originalLocation).split(' ').at(-1)?.replace(/(시|군|구)$/, '')
  const matched = results.find((place) => {
    const haystack = [place.name, place.admin1, place.admin2, place.admin3].filter(Boolean).join(' ')
    return detailToken && haystack.includes(detailToken)
  })

  const place = matched || results[0]
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    name: [place.admin1, place.admin2 || place.name].filter(Boolean).join(' '),
  }
}

const metrics = computed(() => {
  const cropNames = selectedCrops.value
    .map((crop) => `${crop.emoji || ''} ${crop.name}`.trim())
    .filter(Boolean)
    .join(' · ')

  return [
    {
      label: '재배 작물',
      number: cropsLoading.value ? '--' : `${selectedCrops.value.length}종`,
      sub: cropsError.value || cropNames || '마이페이지에서 작물을 선택해주세요',
      subClass: cropsError.value ? 'text-red-600' : 'text-gray-500',
    },
    {
      label: weather.value.locationName || farmLocation.value || '현재 날씨',
      number: weatherLoading.value ? '--' : `${weather.value.temp}°C`,
      sub: weatherError.value || weather.value.condition,
      subClass: weatherError.value ? 'text-red-600' : 'text-gray-600',
      icon: weather.value.icon,
    },
  ]
})

function resolveErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

function resolveCropEmoji(cropName) {
  return cropEmojiMap[cropName] || ''
}

async function loadSelectedCrops() {
  if (!accessToken.value) {
    selectedCrops.value = []
    return
  }

  cropsLoading.value = true
  cropsError.value = ''

  try {
    const [userCrops, cropList] = await Promise.all([
      apiRequest('/api/v1/user-crops/me', { token: accessToken.value }),
      apiRequest('/api/v1/crops', { token: accessToken.value }),
    ])
    const cropsById = new Map((cropList || []).map((crop) => [crop.id, crop]))

    selectedCrops.value = (userCrops || []).map((item) => {
      const crop = cropsById.get(item.cropId)
      const name = crop?.name || item.cropName || `작물 #${item.cropId}`

      return {
        id: item.cropId,
        name,
        emoji: resolveCropEmoji(name),
      }
    })
  } catch (error) {
    selectedCrops.value = []
    cropsError.value = resolveErrorMessage(error, '작물 정보를 불러오지 못했습니다.')
  } finally {
    cropsLoading.value = false
  }
}

async function resolveLocationCoordinates(location) {
  const detailedFallback = findFallbackCoordinates(location)

  if (detailedFallback) {
    return detailedFallback
  }

  const normalizedLocation = normalizeKoreanLocation(location)
  const detailQuery = normalizedLocation.split(' ').at(-1) || normalizedLocation
  const suffixTrimmedLocation = normalizedLocation.replace(/(특별시|광역시|특별자치시|특별자치도|자치도|도)/g, '').trim()
  const suffixTrimmedDetail = detailQuery.replace(/(시|군|구)$/, '')
  const queries = [
    normalizedLocation,
    suffixTrimmedLocation,
    detailQuery,
    suffixTrimmedDetail,
  ].filter(Boolean)

  for (const query of [...new Set(queries)]) {
    const result = await searchOpenMeteoLocation(query, location)

    if (result) {
      return result
    }
  }

  const regionFallback = findFallbackCoordinates(location, regionFallbackCoordinates)

  if (regionFallback) {
    return regionFallback
  }

  throw new Error('지역 좌표를 찾지 못했습니다.')
}

const fetchWeather = async () => {
  if (!hasFarmLocation.value) {
    weather.value = {
      temp: '--',
      condition: '마이페이지에서 농장 지역을 설정해주세요',
      icon: '📍',
      locationName: '',
    }
    return
  }

  weatherLoading.value = true
  weatherError.value = ''

  try {
    const location = farmLocation.value
    const coordinates = await resolveLocationCoordinates(location)
    const params = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current: 'temperature_2m,weather_code',
      timezone: 'Asia/Seoul',
    })
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

    if (!response.ok) {
      throw new Error('날씨 정보를 불러오지 못했습니다.')
    }

    const data = await response.json()

    if (data.current) {
      const temp = Math.round(data.current.temperature_2m)
      const weatherCode = data.current.weather_code

      weather.value.temp = temp

      const conditionMap = {
        0: { text: '맑음', icon: '☀️' },
        1: { text: '구름 조금', icon: '🌤️' },
        2: { text: '구름 많음', icon: '⛅' },
        3: { text: '흐림', icon: '☁️' },
        45: { text: '안개', icon: '🌫️' },
        48: { text: '안개', icon: '🌫️' },
        51: { text: '가벼운 비', icon: '🌧️' },
        53: { text: '중간 비', icon: '🌧️' },
        55: { text: '강한 비', icon: '🌧️' },
        61: { text: '약한 비', icon: '🌧️' },
        63: { text: '중간 비', icon: '🌧️' },
        65: { text: '강한 비', icon: '⛈️' },
        71: { text: '약한 눈', icon: '❄️' },
        73: { text: '중간 눈', icon: '❄️' },
        75: { text: '강한 눈', icon: '❄️' },
        80: { text: '소나기', icon: '🌧️' },
        81: { text: '강한 소나기', icon: '⛈️' },
        82: { text: '폭우', icon: '⛈️' },
        85: { text: '눈 소나기', icon: '🌨️' },
        86: { text: '강한 눈 소나기', icon: '🌨️' },
        95: { text: '천둥폭우', icon: '⛈️' },
      }

      const condition = conditionMap[weatherCode] || { text: '알 수 없음', icon: '❓' }
      weather.value.condition = condition.text
      weather.value.icon = condition.icon
      weather.value.locationName = coordinates.name || location
    }
  } catch (e) {
    weatherError.value = e?.message || '날씨 정보를 불러오지 못했습니다.'
    weather.value.temp = '--'
    weather.value.icon = '⚠️'
    console.error('날씨 정보 불러오기 실패:', e)
  } finally {
    weatherLoading.value = false
  }
}

onMounted(() => {
  loadSelectedCrops()
  fetchWeather()
})

watch(farmLocation, () => {
  fetchWeather()
})
</script>

<template>
  <div
    class="grid gap-4 mb-6"
    style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr))"
  >
    <div
      v-for="m in metrics"
      :key="m.label"
      class="bg-white border border-gray-200 rounded-[10px] p-[1.1rem_1.25rem]"
    >
      <div class="text-gray-400 text-xs mb-2 flex justify-between items-center">
        <span>{{ m.label }}</span>
        <span v-if="m.icon" class="text-xl">{{ m.icon }}</span>
      </div>
      <div class="text-[30px] leading-none font-bold text-gray-900 mb-2 tracking-tight">
        {{ m.number }}
      </div>
      <div class="text-xs" :class="m.subClass">{{ m.sub }}</div>
    </div>
  </div>
</template>
