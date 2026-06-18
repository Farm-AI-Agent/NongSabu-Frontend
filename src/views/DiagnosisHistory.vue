<script setup>
import { onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import AppFooter from '../components/AppFooter.vue'
import { ApiError, apiRequest } from '../lib/api'
import { formatAnalysisText } from '../lib/analysisText'
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

function translateStatus(status) {
  const statusMap = {
    'PENDING': '진행 중',
    'COMPLETED': '완료',
    'FAILED': '실패',
    'PROCESSING': '분석 중',
  }
  return statusMap[status] || '상태 확인 중'
}

function translateSeverity(severity) {
  const severityMap = {
    'LOW': '낮음',
    'MEDIUM': '중간',
    'HIGH': '높음',
    'CRITICAL': '심각',
  }
  return severityMap[severity] || '미분류'
}

function displayAnalysisText(value, fallback) {
  return formatAnalysisText(value, fallback)
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === 'object' && !Array.isArray(value)) || {}
}

function mergeDefined(...objects) {
  return objects.reduce((merged, object) => {
    Object.entries(object || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        merged[key] = value
      }
    })
    return merged
  }, {})
}

function formatDetailText(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (Array.isArray(value)) {
    const lines = value.map((item) => formatDetailText(item, '')).filter(Boolean)
    return lines.length ? lines.join('\n') : fallback
  }

  if (typeof value === 'object') {
    const directText = pick(value.text, value.content, value.description, value.summary, value.message)

    if (directText) {
      return formatDetailText(directText, fallback)
    }

    const lines = Object.entries(value)
      .map(([key, item]) => {
        const text = formatDetailText(item, '')
        return text ? `${key}: ${text}` : ''
      })
      .filter(Boolean)

    return lines.length ? lines.join('\n') : fallback
  }

  const text = String(value).trim()
  return formatAnalysisText(text, text || fallback)
}

function normalizeImageReport(report) {
  const source = report?.report || report || {}
  const guidance = firstObject(source.diseaseGuidance, source.disease_guidance)

  return {
    reportText: pick(source.reportText, source.report_text),
    ragContext: pick(guidance.ragContext, guidance.rag_context, source.ragContext, source.rag_context),
    diseaseName: pick(guidance.diseaseName, guidance.disease_name, source.diseaseName, source.disease_name),
    diseaseInfo: pick(guidance.diseaseInfo, guidance.disease_info),
    outbreakCause: pick(guidance.outbreakCause, guidance.outbreak_cause),
    treatment: pick(guidance.treatment, guidance.treatmentGuide, guidance.treatment_guide),
    recommendation: pick(guidance.treatment, guidance.treatmentGuide, guidance.treatment_guide),
    diseaseGuidance: guidance,
  }
}

function diseaseGuidanceSections(record) {
  return [
    {
      title: '병 정보',
      value: pick(record?.diseaseInfo, record?.disease_info, record?.summary),
      fallback: '병 정보가 아직 준비되지 않았습니다.',
    },
    {
      title: '발병 원인',
      value: pick(record?.outbreakCause, record?.outbreak_cause, record?.cause, record?.reason),
      fallback: '발병 원인 정보가 아직 준비되지 않았습니다.',
    },
    {
      title: '해결 방안',
      value: pick(record?.treatment, record?.solution, record?.recommendation),
      fallback: '해결 방안 정보가 아직 준비되지 않았습니다.',
    },
  ].map((section) => ({
    ...section,
    text: formatDetailText(section.value, section.fallback),
  }))
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
    const imageId = pick(record.imageId, record.image_id, record.id)
    if (!imageId) {
      detailError.value = '리포트를 불러오기 위한 imageId가 없습니다.'
      return
    }

    const detailRequest = apiRequest(`/api/v1/analysis/images/${imageId}`, {
      token: accessToken.value,
    })
    const reportRequest = apiRequest(`/api/v1/reports/images/${imageId}`, {
      method: 'POST',
      token: accessToken.value,
    })
    const [detailResult, reportResult] = await Promise.allSettled([detailRequest, reportRequest])

    if (detailResult.status === 'fulfilled') {
      selected.value = detailResult.value
    } else {
      detailError.value = resolveErrorMessage(detailResult.reason, '상세 결과를 불러오지 못했습니다.')
    }

    if (reportResult.status === 'fulfilled') {
      selected.value = mergeDefined(selected.value, normalizeImageReport(reportResult.value))
    } else {
      const message = resolveErrorMessage(reportResult.reason, '병 설명 리포트를 불러오지 못했습니다.')
      detailError.value = detailError.value ? `${detailError.value} ${message}` : message
    }
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
    <Sidebar />

    <div class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col">
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
                {{ displayAnalysisText(record.diseaseName || record.message, '분석 결과 대기') }}
              </div>
              <div class="mt-2 flex flex-wrap gap-2 text-xs">
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{{ translateStatus(record.status) }}</span>
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

      <AppFooter />
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
              <div class="text-sm font-semibold text-gray-900">{{ translateStatus(selected.status) }}</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">질환명</div>
                <div class="text-sm text-gray-900">
                  {{ displayAnalysisText(selected.diseaseName, '지원 준비 중') }}
                </div>
              </div>
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">심각도</div>
                <div class="text-sm text-gray-900">{{ selected.severity ? translateSeverity(selected.severity) : '-' }}</div>
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">안내 메시지</div>
              <div class="text-sm text-gray-800 leading-relaxed">
                {{ displayAnalysisText(selected.message, '저장된 안내 메시지가 없습니다.') }}
              </div>
            </div>

            <div
              v-for="section in diseaseGuidanceSections(selected)"
              :key="section.title"
              class="rounded-xl border border-gray-200 p-5"
            >
              <div class="text-xs text-gray-500 mb-2">{{ section.title }}</div>
              <div class="whitespace-pre-line text-sm text-gray-800 leading-relaxed">
                {{ section.text }}
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
