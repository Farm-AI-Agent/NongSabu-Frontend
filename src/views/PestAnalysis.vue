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
const cropSearch = ref('')

const selectedFile = ref(null)
const previewUrl = ref('')
const selectedCropId = ref(null)

const submitting = ref(false)
const submitError = ref('')
const analysisResult = ref(null)
const activeDiseaseInfoTab = ref('info')

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
const filteredCrops = computed(() => {
  const keyword = cropSearch.value.trim().toLowerCase()
  const sortedCrops = [...crops.value].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ko'))

  if (!keyword) {
    return sortedCrops
  }

  return sortedCrops.filter((crop) => String(crop.name || '').toLowerCase().includes(keyword))
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
  return formatAnalysisText(analysisResult.value?.message, '분석 결과를 확인했습니다.')
})

const detectionPalette = [
  '#dc3f5f',
  '#2f7d3c',
  '#e09b2d',
  '#2563eb',
  '#7c3aed',
]

const normalizedDetections = computed(() => {
  const detections = asArray(analysisResult.value?.detections)
  const imageSize = analysisResult.value?.imageSize || analysisResult.value?.image_size || {}
  const imageWidth = Number(imageSize.width)
  const imageHeight = Number(imageSize.height)

  return detections
    .map((detection, index) => normalizeDetection(detection, index, imageWidth, imageHeight))
    .filter(Boolean)
})

const detectionCountText = computed(() => {
  const count = Number(analysisResult.value?.detectionCount ?? analysisResult.value?.detection_count ?? normalizedDetections.value.length)
  return `${Number.isFinite(count) ? count : normalizedDetections.value.length}건`
})

const diseaseInfoTabs = computed(() => {
  const result = analysisResult.value || {}

  return [
    {
      key: 'info',
      title: '병 정보',
      fallback: '병에 대한 정보가 응답에 포함되면 이 영역에 표시됩니다.',
      value: pick(result.diseaseInfo, result.disease_info, result.summary, result.description),
    },
    {
      key: 'cause',
      title: '발병 원인',
      fallback: '발병 원인 정보가 응답에 포함되면 이 영역에 표시됩니다.',
      value: pick(result.cause, result.causes, result.reason, result.infectionCause, result.infection_cause),
    },
    {
      key: 'solution',
      title: '해결 방안',
      fallback: '해결 방안 정보가 응답에 포함되면 이 영역에 표시됩니다.',
      value: pick(result.solution, result.solutions, result.treatment, result.treatmentGuide, result.treatment_guide, result.recommendation),
    },
  ].map((section) => ({
    ...section,
    text: formatDetailText(section.value, section.fallback),
    hasValue: Boolean(section.value),
  }))
})

const activeDiseaseInfoSection = computed(() => {
  return diseaseInfoTabs.value.find((section) => section.key === activeDiseaseInfoTab.value) || diseaseInfoTabs.value[0]
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
    const response = await apiRequest('/api/v1/crops', {
      token: accessToken.value || undefined,
    })
    crops.value = normalizeCropList(response)
  } catch (error) {
    cropsError.value = resolveErrorMessage(error, '작물 목록을 불러오지 못했습니다.')
  } finally {
    cropsLoading.value = false
  }
}

function resolveErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (Array.isArray(value.content)) return value.content
  if (Array.isArray(value.items)) return value.items
  if (Array.isArray(value.crops)) return value.crops
  return []
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') ?? ''
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === 'object' && !Array.isArray(value)) || {}
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

function normalizeCropList(value) {
  return asArray(value)
    .map((crop, index) => ({
      ...crop,
      id: crop.id ?? crop.cropId ?? crop.crop_id ?? index,
      name: pick(crop.name, crop.cropName, crop.crop_name, crop.label, `작물 #${crop.id ?? index}`),
    }))
    .filter((crop) => crop.id !== undefined && crop.name)
}

function toPercent(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return 0
  }

  const percent = number > 1 ? number : number * 100
  return Math.max(0, Math.min(100, percent))
}

function formatConfidence(value) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  return `${toPercent(value).toFixed(1)}%`
}

function normalizeDetection(detection, index, imageWidth, imageHeight) {
  const box = extractDetectionBox(detection)
  if (!box) {
    return null
  }

  const { x, y, width, height } = box
  if (![x, y, width, height].every(Number.isFinite)) {
    return null
  }

  const isNormalizedBox = Math.max(Math.abs(x), Math.abs(y), Math.abs(width), Math.abs(height)) <= 1
  const left = isNormalizedBox || !imageWidth ? toPercent(x) : toPercent(x / imageWidth)
  const top = isNormalizedBox || !imageHeight ? toPercent(y) : toPercent(y / imageHeight)
  const boxWidth = Math.min(isNormalizedBox || !imageWidth ? toPercent(width) : toPercent(width / imageWidth), 100 - left)
  const boxHeight = Math.min(isNormalizedBox || !imageHeight ? toPercent(height) : toPercent(height / imageHeight), 100 - top)
  const color = detectionPalette[index % detectionPalette.length]
  const confidence = detection.confidencePercent ?? detection.confidence_percent ?? detection.confidence
  const labelGoesAbove = top >= 8

  return {
    id: `${detection.className || detection.class_name || detection.label || 'detection'}-${index}`,
    label: formatAnalysisText(detection.label || detection.className || detection.class_name, '병해충'),
    confidenceText: formatConfidence(confidence),
    color,
    boxStyle: {
      left: `${left}%`,
      top: `${top}%`,
      width: `${boxWidth}%`,
      height: `${boxHeight}%`,
      borderColor: color,
    },
    labelStyle: {
      left: `${left}%`,
      top: `${labelGoesAbove ? top : top + 1}%`,
      backgroundColor: color,
      transform: labelGoesAbove ? 'translateY(-100%)' : 'translateY(0)',
    },
  }
}

function extractDetectionBox(detection) {
  const rawBox = pick(detection?.bbox, detection?.box, detection?.boundingBox, detection?.bounding_box)
  const format = String(pick(detection?.bboxFormat, detection?.bbox_format, detection?.boxFormat, detection?.box_format)).toLowerCase()

  if (Array.isArray(rawBox) && rawBox.length >= 4) {
    const [x, y, third, fourth] = rawBox.map(Number)
    const isCornerBox = format.includes('xyxy') || format.includes('x1y1x2y2')

    return {
      x,
      y,
      width: isCornerBox ? third - x : third,
      height: isCornerBox ? fourth - y : fourth,
    }
  }

  if (rawBox && typeof rawBox === 'object') {
    const x = Number(pick(rawBox.x, rawBox.left, rawBox.x1, rawBox.xmin, rawBox.minX, rawBox.min_x))
    const y = Number(pick(rawBox.y, rawBox.top, rawBox.y1, rawBox.ymin, rawBox.minY, rawBox.min_y))
    const widthValue = pick(rawBox.width, rawBox.w)
    const heightValue = pick(rawBox.height, rawBox.h)
    const x2 = pick(rawBox.x2, rawBox.xmax, rawBox.maxX, rawBox.max_x, rawBox.right)
    const y2 = pick(rawBox.y2, rawBox.ymax, rawBox.maxY, rawBox.max_y, rawBox.bottom)

    return {
      x,
      y,
      width: widthValue !== '' ? Number(widthValue) : Number(x2) - x,
      height: heightValue !== '' ? Number(heightValue) : Number(y2) - y,
    }
  }

  const x = Number(pick(detection?.x, detection?.left, detection?.x1, detection?.xmin, detection?.minX, detection?.min_x))
  const y = Number(pick(detection?.y, detection?.top, detection?.y1, detection?.ymin, detection?.minY, detection?.min_y))
  const widthValue = pick(detection?.width, detection?.w)
  const heightValue = pick(detection?.height, detection?.h)
  const x2 = pick(detection?.x2, detection?.xmax, detection?.maxX, detection?.max_x, detection?.right)
  const y2 = pick(detection?.y2, detection?.ymax, detection?.maxY, detection?.max_y, detection?.bottom)

  if ([x, y].some((value) => !Number.isFinite(value))) {
    return null
  }

  return {
    x,
    y,
    width: widthValue !== '' ? Number(widthValue) : Number(x2) - x,
    height: heightValue !== '' ? Number(heightValue) : Number(y2) - y,
  }
}

function normalizeAnalysisResult(response) {
  const source = response?.analysisResult || response?.analysis_result || response?.result || response?.prediction || response || {}
  const ragSource = firstObject(
    source.ragResult,
    source.rag_result,
    source.rag,
    source.diseaseKnowledge,
    source.disease_knowledge,
    source.knowledge,
    response?.ragResult,
    response?.rag_result,
    response?.rag,
  )
  const imageProcessingSource = firstObject(
    source.imageProcessingInfo,
    source.image_processing_info,
    source.imageProcessing,
    source.image_processing,
    source.detectionResult,
    source.detection_result,
    source.visionResult,
    source.vision_result,
    response?.imageProcessingInfo,
    response?.image_processing_info,
    response?.imageProcessing,
    response?.image_processing,
    response?.detectionResult,
    response?.detection_result,
  )

  return {
    ...response,
    ...source,
    status: pick(source.status, response?.status, 'COMPLETED'),
    cropName: pick(source.cropName, source.crop_name, response?.cropName, selectedCropName.value),
    diseaseName: pick(source.diseaseName, source.disease_name, source.diagnosisName, source.diagnosis_name, source.className, source.class_name, source.label, source.prediction),
    confidence: pick(source.confidence, source.confidenceScore, source.confidence_score, source.probability, source.score),
    message: pick(source.message, source.resultMessage, source.result_message, response?.message),
    summary: pick(source.summary, source.description, source.overview, source.explanation, ragSource.summary, ragSource.description, ragSource.overview),
    recommendation: pick(source.recommendation, source.recommendations, source.action, source.treatment, source.treatmentGuide, source.treatment_guide, ragSource.recommendation, ragSource.recommendations, ragSource.solution, ragSource.solutions, ragSource.treatment, ragSource.treatmentGuide, ragSource.treatment_guide),
    severity: pick(source.severity, response?.severity),
    detections: asArray(pick(source.detections, source.detectionResults, source.detection_results, source.objects, source.detectedObjects, source.detected_objects, imageProcessingSource.detections, imageProcessingSource.detectionResults, imageProcessingSource.detection_results, imageProcessingSource.objects, imageProcessingSource.boxes, imageProcessingSource.results, response?.detections)),
    detectionCount: pick(source.detectionCount, source.detection_count, imageProcessingSource.detectionCount, imageProcessingSource.detection_count, response?.detectionCount, response?.detection_count),
    imageSize: pick(source.imageSize, source.image_size, imageProcessingSource.imageSize, imageProcessingSource.image_size, response?.imageSize, response?.image_size),
    diseaseInfo: pick(source.diseaseInfo, source.disease_info, source.diseaseDescription, source.disease_description, ragSource.diseaseInfo, ragSource.disease_info, ragSource.diseaseDescription, ragSource.disease_description, ragSource.info, ragSource.description, response?.diseaseInfo, response?.disease_info),
    cause: pick(source.cause, source.causes, source.reason, source.infectionCause, source.infection_cause, ragSource.cause, ragSource.causes, ragSource.reason, ragSource.infectionCause, ragSource.infection_cause),
    solution: pick(source.solution, source.solutions, source.treatment, source.treatmentGuide, source.treatment_guide, ragSource.solution, ragSource.solutions, ragSource.treatment, ragSource.treatmentGuide, ragSource.treatment_guide, ragSource.management, ragSource.control),
  }
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
  activeDiseaseInfoTab.value = 'info'
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
    const response = await apiRequest('/api/v1/analysis/images', {
      method: 'POST',
      body: formData,
      token: accessToken.value,
    })
    analysisResult.value = normalizeAnalysisResult(response)
    activeDiseaseInfoTab.value = 'info'
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
          <p class="text-emerald-700 font-medium">
            업로드한 이미지는 실제 분석 모델 API로 전달되며, 내려온 진단 결과를 그대로 표시합니다.
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
          <div class="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white border border-brand-border rounded-2xl shadow-sm">
            <svg viewBox="0 0 48 48" class="w-9 h-9 text-brand" fill="none" aria-hidden="true">
              <path d="M15 16l3-5h12l3 5h5a4 4 0 014 4v16a4 4 0 01-4 4H10a4 4 0 01-4-4V20a4 4 0 014-4h5z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
              <circle cx="24" cy="28" r="8" stroke="currentColor" stroke-width="3" />
              <path d="M34 22h2" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
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
              <div v-else>
                <input
                  v-model.trim="cropSearch"
                  type="text"
                  placeholder="작물 이름 검색"
                  class="w-full mb-4 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
                <div class="max-h-[520px] overflow-y-auto pr-1">
                  <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                    <button
                      v-for="crop in filteredCrops"
                      :key="crop.id"
                      class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border-2 min-h-[120px]"
                      :class="
                        selectedCropId === crop.id
                          ? 'bg-brand/10 border-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      "
                      @click="selectedCropId = crop.id"
                    >
                      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center text-3xl shadow-sm">
                        {{ getCropEmoji(crop.name) }}
                      </div>
                      <div class="text-sm font-semibold text-gray-900 text-center leading-tight">{{ crop.name }}</div>
                    </button>
                  </div>
                  <div v-if="!filteredCrops.length" class="rounded-lg bg-slate-50 p-5 text-sm text-gray-500 text-center">
                    검색된 작물이 없습니다.
                  </div>
                </div>
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

        <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-8 mb-8">
          <div class="space-y-4">
            <div class="relative overflow-hidden rounded-lg border border-gray-200 bg-slate-100">
              <img
                :src="previewUrl"
                alt="분석한 이미지"
                class="block w-full h-auto"
              />

              <template v-for="detection in normalizedDetections" :key="detection.id">
                <div
                  class="absolute border-2 pointer-events-none"
                  :style="detection.boxStyle"
                ></div>
                <div
                  class="absolute z-10 rounded-t px-2 py-1 text-[12px] font-bold text-white shadow-sm pointer-events-none"
                  :style="detection.labelStyle"
                >
                  {{ detection.label }} {{ detection.confidenceText }}
                </div>
              </template>
            </div>

            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <div class="mb-4 grid grid-cols-3 gap-2">
                <button
                  v-for="section in diseaseInfoTabs"
                  :key="section.key"
                  class="min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors"
                  :class="
                    activeDiseaseInfoTab === section.key
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  "
                  @click="activeDiseaseInfoTab = section.key"
                >
                  {{ section.title }}
                </button>
              </div>

              <div class="rounded-lg bg-slate-50 p-4">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <div class="text-sm font-bold text-gray-900">{{ activeDiseaseInfoSection.title }}</div>
                  <span
                    v-if="!activeDiseaseInfoSection.hasValue"
                    class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500"
                  >
                    응답 대기
                  </span>
                </div>
                <div class="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {{ activeDiseaseInfoSection.text }}
                </div>
              </div>
            </div>
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

            <div class="rounded-xl border border-gray-200 bg-white p-4">
              <div class="mb-3 flex items-center justify-between">
                <div class="text-sm font-bold text-gray-900">감지 결과</div>
                <div class="text-xs text-gray-500">{{ detectionCountText }}</div>
              </div>
              <div v-if="normalizedDetections.length" class="space-y-2">
                <div
                  v-for="detection in normalizedDetections"
                  :key="`${detection.id}-row`"
                  class="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-md border border-gray-100 bg-gray-50 pr-3 text-sm"
                >
                  <div class="h-9 rounded-l-md" :style="{ backgroundColor: detection.color }"></div>
                  <div class="font-medium text-gray-800">{{ detection.label }}</div>
                  <div class="font-semibold text-gray-900">{{ detection.confidenceText }}</div>
                </div>
              </div>
              <div v-else class="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-500">
                탐지된 병반 영역이 없습니다.
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
