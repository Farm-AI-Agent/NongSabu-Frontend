<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const { farmLocation } = useFarmProfileState()

const crops = [
  { id: 1, name: '토마토', emoji: '🍅' },
  { id: 2, name: '딸기', emoji: '🍓' },
  { id: 3, name: '오이', emoji: '🥒' },
  { id: 4, name: '상추', emoji: '🥬' },
  { id: 5, name: '배추', emoji: '🥬' },
  { id: 6, name: '고추', emoji: '🌶️' },
  { id: 7, name: '당근', emoji: '🥕' },
  { id: 8, name: '옥수수', emoji: '🌽' },
  { id: 9, name: '포도', emoji: '🍇' },
  { id: 10, name: '딸기', emoji: '🍓' },
  { id: 11, name: '배', emoji: '🍐' },
  { id: 12, name: '사과', emoji: '🍎' },
  { id: 13, name: '수박', emoji: '🍉' },
  { id: 14, name: '멜론', emoji: '🍈' },
  { id: 15, name: '파프리카', emoji: '🌶️' },
]

const selectedCrops = ref([])
const weather = ref({
  temp: '--',
  condition: '날씨 정보',
  icon: '🌤️'
})

const metrics = computed(() => {
  const cropNames = selectedCrops.value
    .map(id => crops.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(' · ')

  return [
    {
      label: '재배 작물',
      number: `${selectedCrops.value.length}종`,
      sub: cropNames || '작물을 선택해주세요',
      subClass: 'text-gray-500'
    },
    { label: '현재 날씨', number: `${weather.value.temp}°C`, sub: weather.value.condition, subClass: 'text-gray-600', icon: weather.value.icon },
  ]
})

const fetchWeather = async () => {
  try {
    const location = farmLocation.value || '서울'
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=37.5&longitude=126.9&current=temperature_2m,weather_code&timezone=Asia/Seoul`
    )
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
    }
  } catch (e) {
    console.error('날씨 정보 불러오기 실패:', e)
  }
}

onMounted(() => {
  const saved = localStorage.getItem('fd_profile')
  if (saved) {
    try {
      const profile = JSON.parse(saved)
      selectedCrops.value = profile.selectedCrops || []
    } catch (e) {
      console.error('프로필 데이터 불러오기 실패:', e)
    }
  }

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
