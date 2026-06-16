<script setup>
import { ref, computed, onMounted } from 'vue'

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
    { label: '시세 동향', number: '상승세', sub: '토마토 +8.2%', subClass: 'text-success' },
  ]
})

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
      <div class="text-gray-400 text-xs mb-2">{{ m.label }}</div>
      <div class="text-[30px] leading-none font-bold text-gray-900 mb-2 tracking-tight">
        {{ m.number }}
      </div>
      <div class="text-xs" :class="m.subClass">{{ m.sub }}</div>
    </div>
  </div>
</template>
