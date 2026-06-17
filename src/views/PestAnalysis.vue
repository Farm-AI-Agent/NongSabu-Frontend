<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import NavTabs from '../components/NavTabs.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { accessToken } = useAuth()

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
  if (!analysisResult.value?.supported || !analysisResult.value?.confidence) {
    return '-'
  }

  return `${(analysisResult.value.confidence * 100).toFixed(1)}%`
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

// 작물 선택지는 백엔드에서 받아옵니다.
// 이렇게 하면 업로드 화면의 작물 ID와 분석 API가 기대하는 작물 ID를 동일하게 맞출 수 있습니다.
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

// 현재 세션에서만 사용할 미리보기 URL을 로컬에 보관합니다.
// 저장된 분석 이력은 이후 백엔드에서 다시 불러옵니다.
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
    <NavTabs active="병해충 분석" />

    <div v-if="currentStep === 'upload'" class="px-5 py-7 max-w-shell mx-auto">
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
            현재 MVP에서는 포도 작물만 실제 병해 분석이 수행되고, 다른 작물은 지원 준비 상태로 저장됩니다.
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
    </div>

    <div v-else-if="currentStep === 'crop'" class="px-5 py-7 max-w-shell mx-auto">
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
                  class="text-left p-4 rounded-xl transition-colors border-2"
                  :class="
                    selectedCropId === crop.id
                      ? 'bg-brand/10 border-brand'
                      : 'border-gray-200 hover:border-gray-300'
                  "
                  @click="selectedCropId = crop.id"
                >
                  <div class="text-sm font-semibold text-gray-900">{{ crop.name }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ crop.category || '작물' }}</div>
                </button>
              </div>

              <p class="text-xs text-gray-500 mt-4">
                현재 백엔드 로직상 포도는 FastAPI 분석까지 진행되고, 그 외 작물도 업로드와 기록 저장은 정상적으로 수행됩니다.
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
    </div>

    <div v-else class="px-5 py-7 max-w-shell mx-auto">
      <div class="bg-white border border-gray-200 rounded-[10px] p-8">
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <div class="text-[15px] font-bold text-gray-900">진단 결과</div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="resultBadgeClass">
            {{ analysisResult.status }}
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
              <div class="text-sm text-gray-800 leading-relaxed">{{ analysisResult.message }}</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-xl border border-gray-200 p-5">
                <div class="text-xs text-gray-500 mb-2">질환명</div>
                <div class="text-base font-semibold text-gray-900">
                  {{ analysisResult.diseaseName || '지원 준비 중' }}
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
                {{ analysisResult.summary || '백엔드에 분석 기록이 저장되었습니다.' }}
              </div>
            </div>

            <div class="rounded-xl border border-gray-200 p-5">
              <div class="text-xs text-gray-500 mb-2">권장 조치</div>
              <div class="text-sm text-gray-800 leading-relaxed">
                {{ analysisResult.recommendation || '진단 이력 화면에서 저장된 결과를 다시 확인할 수 있습니다.' }}
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
    </div>

    <FloatingChatButton />
  </div>
</template>
