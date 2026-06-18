<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import AppFooter from '../components/AppFooter.vue'
import { ApiError, apiRequest } from '../lib/api'
import { formatAnalysisText } from '../lib/analysisText'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { accessToken } = useAuth()

const cropEmojiMap = {
  '포도': '🍇',
  '딸기': '🍓',
  '토마토': '🍅',
  '오이': '🥒',
  '수박': '🍉',
  '배추': '🥬',
  '브로콜리': '🥦',
  '양파': '🧅',
  '당근': '🥕',
  '옥수수': '🌽',
  '배': '🍐',
  '사과': '🍎',
  '복숭아': '🍑',
  '귤': '🍊',
  '바나나': '🍌',
  '수수': '🌾',
  '보리': '🌾',
  '쌀': '🍚',
  '무': '⚪',
  '감자': '🥔',
  '고구마': '🍠',
  '올리브': '🫒',
  '레몬': '🍋',
  '파': '🌱',
  '가지': '🍆',
}

function getCropEmoji(cropName) {
  return cropEmojiMap[cropName] || '🌱'
}

const agreed = ref(null)
const fileInput = ref(null)
const isDragOver = ref(false)

const crops = ref([])
const cropsLoading = ref(false)
const cropsError = ref('')

const selectedFile = ref(null)
const previewUrl = ref('')
const selectedCropId = ref(null)

const submitting = ref(false)
const submitError = ref('')
const analysisResult = ref(null)

const currentStep = computed(() => {
  if (analysisResult.value) {
    return 'result'
  }

  if (selectedFile.value) {
    return 'crop'
  }

  return 'upload'
})

const selectedCropName = computed(() => {
  const crop = crops.value.find((item) => item.id === selectedCropId.value)
  return crop?.name || analysisResult.value?.cropName || ''
})

const confidenceText = computed(() => {
  if (analysisResult.value?.confidence === undefined || analysisResult.value?.confidence === null) {
    return '-'
  }

  const confidence = Number(analysisResult.value.confidence)
  const normalized = confidence > 1 ? confidence : confidence * 100
  return Number.isFinite(normalized) ? `${normalized.toFixed(1)}%` : '-'
})

const diagnosisName = computed(() => {
  return formatAnalysisText(
    analysisResult.value?.diseaseName || analysisResult.value?.label || analysisResult.value?.prediction,
    '분석 결과 대기',
  )
})

const analysisMessage = computed(() => {
  return formatAnalysisText(analysisResult.value?.message, '더미 모델 분석 응답을 받았습니다.')
})

const summaryText = computed(() => {
  return formatAnalysisText(
    analysisResult.value?.summary || analysisResult.value?.description,
    '더미 모델 응답 또는 저장된 분석 기록에 요약 정보가 포함되지 않았습니다.',
  )
})

const recommendationText = computed(() => {
  return formatAnalysisText(
    analysisResult.value?.recommendation || analysisResult.value?.action,
    '권장 조치 정보가 응답에 포함되면 이 영역에 표시됩니다.',
  )
})

const resultBadgeClass = computed(() => {
  switch (analysisResult.value?.status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700'
    case 'UNSUPPORTED':
      return 'bg-amber-100 text-amber-700'
    case 'FAILED':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
})

async function loadCrops() {
  cropsLoading.value = true
  cropsError.value = ''

  try {
    crops.value = await apiRequest('/api/v1/crops', {
      token: accessToken.value || undefined,
    })
  } catch (error) {
    cropsError.value = resolveErrorMessage(error, '작물 목록을 불러오지 못했습니다.')
  } finally {
    cropsLoading.value = false
  }
}

function resolveErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

function revokePreviewUrl() {
  if (!previewUrl.value) {
    return
  }

  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function selectFile(file) {
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    submitError.value = '이미지 파일만 업로드할 수 있습니다.'
    return
  }

  revokePreviewUrl()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  selectedCropId.value = null
  analysisResult.value = null
  submitError.value = ''
}

function resetToUpload() {
  revokePreviewUrl()
  selectedFile.value = null
  selectedCropId.value = null
  analysisResult.value = null
  submitError.value = ''
}

function handleImageUpload(event) {
  selectFile(event.target.files?.[0] || null)
  event.target.value = ''
}

function handleDragOver(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
}

function handleDrop(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  if (!agreed.value) {
    return
  }

  selectFile(event.dataTransfer?.files?.[0] || null)
}

async function requestDiagnosis() {
  if (!selectedFile.value) {
    submitError.value = '분석할 이미지를 먼저 선택해주세요.'
    return
  }

  if (!selectedCropId.value) {
    submitError.value = '작물을 선택한 뒤 분석을 요청해주세요.'
    return
  }

  submitting.value = true
  submitError.value = ''

  const formData = new FormData()
  formData.append('cropId', String(selectedCropId.value))
  formData.append('file', selectedFile.value)

  try {
    analysisResult.value = await apiRequest('/api/v1/analysis/images', {
      method: 'POST',
      body: formData,
      token: accessToken.value,
    })
  } catch (error) {
    submitError.value = resolveErrorMessage(error, '이미지 분석 요청에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

function translateStatus(status) {
  const statusMap = {
    'COMPLETED': '분석 완료',
    'UNSUPPORTED': '지원 준비 중',
    'FAILED': '분석 실패',
    'PROCESSING': '분석 중',
  }
  return statusMap[status] || '상태 확인 중'
}

function openHistory() {
  router.push('/diagnosis-history')
}

onMounted(() => {
  loadCrops()
})

onBeforeUnmount(() => {
  revokePreviewUrl()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <Sidebar />

    <div v-if="currentStep === 'upload'" class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col">
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">병해충 분석</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">AI 병해충 이미지 진단</div>
      </div>

      <div class="bg-white border border-gray-200 rounded-[10px] p-6 mb-6">
        <div class="space-y-3 text-sm leading-relaxed">
          <p class="text-gray-700">
            선명한 작물 사진을 업로드하면 백엔드에서 이미지를 저장하고 AI 분석 결과를 함께 기록합니다.
          </p>
          <p class="text-amber-700 font-medium">
            현재 모델은 더미 모델 단계입니다. 응답 구조는 실제 분석 모델 연동을 기준으로 표시됩니다.
          </p>
        </div>

        <div class="flex justify-center gap-8 mt-6 pt-5 border-t border-gray-100">
          <button
            class="flex items-center gap-2 text-sm"
            :class="agreed === true ? 'text-gray-900 font-medium' : 'text-gray-500'"
            @click="agreed = true"
          >
            <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="agreed === true ? 'border-brand' : 'border-slate-300'">
              <span v-if="agreed === true" class="w-2 h-2 rounded-full bg-brand"></span>
            </span>
            안내 내용을 확인했습니다
          </button>
          <button
            class="flex items-center gap-2 text-sm"
            :class="agreed === false ? 'text-gray-900 font-medium' : 'text-gray-500'"
            @click="agreed = false"
          >
            <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center" :class="agreed === false ? 'border-brand' : 'border-slate-300'">
              <span v-if="agreed === false" class="w-2 h-2 rounded-full bg-brand"></span>
            </span>
            나중에 다시 확인할게요
          </button>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-[10px] p-6">
        <div class="text-center mb-5">
          <span class="text-base font-bold text-gray-900">진단할 사진 업로드</span>
          <span class="text-[13px] text-gray-400 ml-2">실제 분석 요청에 사용할 이미지를 선택해주세요.</span>
        </div>

        <div
          class="border-[1.5px] border-dashed rounded-[10px] p-12 text-center transition-all"
          :class="
            isDragOver
              ? 'border-brand bg-brand/5'
              : agreed
              ? 'border-slate-300 bg-[#fafbfc]'
              : 'border-gray-200 bg-gray-50 opacity-60'
          "
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div class="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-brand-light rounded-xl">
            <div class="w-[26px] h-[26px] border-2 border-brand rounded-md"></div>
          </div>
          <div class="text-gray-600 text-sm mb-1">사진을 끌어다 놓거나 직접 파일을 선택해주세요.</div>
          <div class="text-accent text-sm mb-5">JPG, PNG, WEBP 형식을 권장합니다.</div>
          <button
            :disabled="!agreed"
            class="px-6 py-2.5 text-white rounded-lg font-medium text-sm"
            :class="agreed ? 'bg-accent cursor-pointer' : 'bg-slate-300 cursor-not-allowed'"
            @click="fileInput?.click()"
          >
            사진 찾기
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageUpload"
          />
        </div>

        <p v-if="agreed === false" class="text-center mt-4 text-[13px] text-red-600">
          업로드 전에 안내 확인 여부를 선택해주세요.
        </p>
        <p v-if="submitError" class="text-center mt-4 text-[13px] text-red-600">
          {{ submitError }}
        </p>
      </div>

      <AppFooter />
    </div>

    <div v-else-if="currentStep === 'crop'" class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col">
      <div class="bg-white border border-gray-200 rounded-[10px] p-8">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div>
            <img
              :src="previewUrl"
              alt="업로드한 작물 이미지"
              class="w-full rounded-lg object-cover border border-gray-200"
              style="aspect-ratio: 4/3"
            />
          </div>

          <div class="flex flex-col justify-between gap-6">
            <div>
              <div class="mb-6">
                <div class="text-[15px] font-bold text-gray-900 mb-2">작물 선택</div>
                <div class="text-sm text-gray-600">
                  이미지와 가장 가까운 작물을 선택하면 해당 ID로 분석 API를 호출합니다.
                </div>
              </div>

              <div v-if="cropsLoading" class="text-sm text-gray-500">작물 목록을 불러오는 중입니다...</div>
              <div v-else-if="cropsError" class="rounded-lg bg-rose-50 text-rose-700 text-sm p-4">
                {{ cropsError }}
              </div>
              <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  v-for="crop in crops"
                  :key="crop.id"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border-2"
                  :class="
                    selectedCropId === crop.id
                      ? 'bg-brand/10 border-brand'
                      : 'border-gray-200 hover:border-gray-300'
                  "
                  @click="selectedCropId = crop.id"
                >
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center text-4xl shadow-sm">
                    {{ getCropEmoji(crop.name) }}
                  </div>
                  <div class="text-sm font-semibold text-gray-900 text-center">{{ crop.name }}</div>
                </button>
              </div>

              <p class="text-xs text-gray-500 mt-4">
                선택한 작물 ID와 이미지를 그대로 백엔드 분석 API로 전달합니다.
              </p>
            </div>

            <div>
              <p v-if="submitError" class="mb-3 text-sm text-red-600">{{ submitError }}</p>
              <div class="flex gap-3">
                <button
                  class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  @click="resetToUpload"
                >
                  다시 업로드
                </button>
                <button
                  class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:bg-slate-300"
                  :disabled="submitting || !selectedCropId"
                  @click="requestDiagnosis"
                >
                  {{ submitting ? '분석 요청 중...' : 'AI 진단 요청' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>

    <div v-else class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col">
      <div class="bg-white border border-gray-200 rounded-[10px] p-8">
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <div class="text-[15px] font-bold text-gray-900">진단 결과</div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="resultBadgeClass">
            {{ translateStatus(analysisResult.status) }}
          </span>
          <span class="text-sm text-gray-500">{{ selectedCropName }}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 mb-8">
          <div>
            <img
              :src="previewUrl"
              alt="분석한 이미지"
              class="w-full rounded-lg object-cover border border-gray-200"
              style="aspect-ratio: 4/3"
            />
          </div>

          <div class="space-y-4">
            <div class="rounded-xl bg-slate-50 p-5">
              <div class="text-xs text-gray-500 mb-2">분석 메시지</div>
              <div class="text-sm text-gray-800 leading-relaxed">{{ analysisMessage }}</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">질환명</div>
                <div class="text-base font-semibold text-gray-900">
                  {{ diagnosisName }}
                </div>
              </div>
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">신뢰도</div>
                <div class="text-base font-semibold text-gray-900">{{ confidenceText }}</div>
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">요약</div>
              <div class="text-sm text-gray-800 leading-relaxed">
                {{ summaryText }}
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">권장 조치</div>
              <div class="text-sm text-gray-800 leading-relaxed">
                {{ recommendationText }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="resetToUpload"
          >
            다른 이미지 업로드
          </button>
          <button
            class="flex-1 py-3 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            @click="openHistory"
          >
            진단 이력 보기
          </button>
        </div>
      </div>

      <AppFooter />
    </div>

    <FloatingChatButton />
  </div>
</template>
