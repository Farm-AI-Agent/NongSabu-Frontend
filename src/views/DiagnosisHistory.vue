<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import NavTabs from '../components/NavTabs.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'

const history = ref([])
const selected = ref(null)
const showModal = ref(false)

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('fd_diagnosis_history') || '[]')
  } catch (e) {
    return []
  }
}

function saveHistory(list) {
  localStorage.setItem('fd_diagnosis_history', JSON.stringify(list))
}

function openDetail(rec) {
  selected.value = rec
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selected.value = null
}

function removeRecord(id) {
  history.value = history.value.filter(r => r.id !== id)
  saveHistory(history.value)
}

onMounted(() => {
  history.value = loadHistory()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <NavTabs active="병해충 분석" />

    <div class="px-5 py-7 max-w-shell mx-auto">
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">진단 이력</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">과거 진단 기록</div>
      </div>

      <div v-if="history.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-sm">저장된 진단 기록이 없습니다.</div>
      </div>

      <div class="space-y-4 mb-8">
        <div
          v-for="rec in history"
          :key="rec.id"
          class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div class="w-20 h-14 bg-gray-50 rounded overflow-hidden flex-shrink-0">
              <img v-if="rec.image" :src="rec.image" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1">
              <div class="text-sm text-gray-500">{{ new Date(rec.date).toLocaleString() }}</div>
              <div class="text-lg font-bold text-gray-900">{{ rec.selectedCrop || '미지정' }}</div>
              <div class="text-sm text-gray-600">타입: {{ rec.diagnosisType }}</div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <button @click="openDetail(rec)" class="px-3 py-1 text-sm border rounded">상세</button>
              <button @click="removeRecord(rec.id)" class="px-3 py-1 text-sm border rounded text-red-600">삭제</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="showModal && selected" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" @click.self="closeModal">
      <div class="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">진단 상세</h2>
          <button @click="closeModal" class="text-2xl text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div class="px-5 py-6">
          <div class="mb-4">
            <div class="text-sm text-gray-500">{{ new Date(selected.date).toLocaleString() }}</div>
            <div class="text-xl font-bold text-gray-900">{{ selected.selectedCrop || '미지정' }}</div>
          </div>

          <div v-if="selected.image" class="mb-4">
            <img :src="selected.image" alt="진단 이미지" class="w-full rounded-lg object-cover border border-gray-200" style="aspect-ratio: 4/3" />
          </div>

          <div class="mb-4">
            <div class="text-sm text-gray-700 font-medium mb-2">진단 결과</div>
            <div v-for="d in selected.diagnosisData" :key="d.name" class="flex justify-between text-sm py-1">
              <div>{{ d.name }}</div>
              <div class="font-medium">{{ d.percentage }}%</div>
            </div>
          </div>

          <button @click="closeModal" class="w-full py-3.5 bg-brand text-white rounded-lg text-sm font-medium">닫기</button>
        </div>
      </div>
    </div>

    <FloatingChatButton />
  </div>
</template>
