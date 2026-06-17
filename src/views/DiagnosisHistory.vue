<script setup>
import { onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import NavTabs from '../components/NavTabs.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'

const { accessToken } = useAuth()

const history = ref([])
const loading = ref(false)
const errorMessage = ref('')

const selected = ref(null)
const showModal = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

function resolveErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('ko-KR')
}

async function loadHistory() {
  loading.value = true
  errorMessage.value = ''

  try {
    history.value = await apiRequest('/api/v1/analysis/images', {
      token: accessToken.value,
    })
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '진단 이력을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

// 목록 응답 데이터만으로도 개요 카드를 보여주기에는 충분하지만,
// 행을 열 때마다 상세 데이터를 다시 조회해서 모달이 항상 백엔드의 최신 데이터를 반영하도록 합니다.
async function openDetail(record) {
  showModal.value = true
  detailLoading.value = true
  detailError.value = ''
  selected.value = record

  try {
    selected.value = await apiRequest(`/api/v1/analysis/images/${record.imageId}`, {
      token: accessToken.value,
    })
  } catch (error) {
    detailError.value = resolveErrorMessage(error, '상세 결과를 불러오지 못했습니다.')
  } finally {
    detailLoading.value = false
  }
}

function closeModal() {
  showModal.value = false
  selected.value = null
  detailError.value = ''
}

onMounted(() => {
  loadHistory()
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
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">저장된 이미지 분석 기록</div>
      </div>

      <div v-if="loading" class="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">
        진단 이력을 불러오는 중입니다...
      </div>

      <div v-else-if="errorMessage" class="bg-rose-50 text-rose-700 rounded-xl p-5 text-sm">
        {{ errorMessage }}
      </div>

      <div v-else-if="history.length === 0" class="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">
        아직 저장된 진단 기록이 없습니다.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="record in history"
          :key="record.imageId"
          class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
        >
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <div class="flex-1">
              <div class="text-sm text-gray-500">{{ formatDate(record.createdAt) }}</div>
              <div class="mt-1 text-lg font-bold text-gray-900">
                {{ record.cropName || '작물 정보 없음' }}
              </div>
              <div class="mt-1 text-sm text-gray-600">
                {{ record.diseaseName || record.message }}
              </div>
              <div class="mt-2 flex flex-wrap gap-2 text-xs">
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{{ record.status }}</span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{{ record.filename }}</span>
              </div>
            </div>

            <button
              class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="openDetail(record)"
            >
              상세 보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl max-h-[85vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">진단 상세</h2>
          <button class="text-2xl text-gray-400 hover:text-gray-600" @click="closeModal">×</button>
        </div>

        <div class="px-5 py-6">
          <div v-if="detailLoading" class="text-sm text-gray-500">상세 결과를 불러오는 중입니다...</div>
          <div v-else-if="selected" class="space-y-4">
            <div>
              <div class="text-sm text-gray-500">{{ formatDate(selected.createdAt) }}</div>
              <div class="text-xl font-bold text-gray-900 mt-1">{{ selected.cropName || '작물 정보 없음' }}</div>
              <div class="text-sm text-gray-500 mt-1">{{ selected.filename }}</div>
            </div>

            <div class="rounded-xl bg-slate-50 p-5">
              <div class="text-xs text-gray-500 mb-2">상태</div>
              <div class="text-sm font-semibold text-gray-900">{{ selected.status }}</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">질환명</div>
                <div class="text-sm text-gray-900">{{ selected.diseaseName || '지원 준비 중' }}</div>
              </div>
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">심각도</div>
                <div class="text-sm text-gray-900">{{ selected.severity || '-' }}</div>
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">안내 메시지</div>
              <div class="text-sm text-gray-800 leading-relaxed">{{ selected.message }}</div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">요약</div>
              <div class="text-sm text-gray-800 leading-relaxed">
                {{ selected.summary || '저장된 분석 결과가 없습니다.' }}
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">권장 조치</div>
              <div class="text-sm text-gray-800 leading-relaxed">
                {{ selected.recommendation || '권장 조치 정보가 없습니다.' }}
              </div>
            </div>

            <p v-if="detailError" class="text-sm text-red-600">{{ detailError }}</p>

            <button
              class="w-full py-3.5 bg-brand text-white rounded-lg text-sm font-medium"
              @click="closeModal"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>

    <FloatingChatButton />
  </div>
</template>
