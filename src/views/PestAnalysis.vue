<script setup>
import { ref, computed } from 'vue'
// AppHeader is rendered globally from App.vue
// NavTabs removed per design
import FloatingChatButton from '../components/FloatingChatButton.vue'

// 1️⃣ 동의 상태 관리
// 왜? 사용자가 약관에 동의해야만 사진 업로드 가능하게 하기 위해
const agreed = ref(null) // null | true | false
const agreedYes = computed(() => agreed.value === true)

// 2️⃣ 사진 업로드 상태 관리
// 왜? 업로드된 사진을 표시하고, 진단 결과 화면으로 전환하기 위해
const uploadedImage = ref(null)
const showResult = ref(false)

// 3️⃣ 진단 결과 화면에서 사용할 데이터
// 왜? 병/해충 선택, 작물 선택 등의 상태를 관리하기 위해
const diagnosisType = ref('병') // '병' | '해충'
const selectedCrop = ref(null)
const showDiagnosisResult = ref(false)

// 4️⃣ 사용 가능한 작물 목록
// 왜? 사용자가 선택할 수 있는 작물을 제공하기 위해
const crops = [
  { id: 1, name: '감', emoji: '🍊' },
  { id: 2, name: '감귤', emoji: '🍊' },
  { id: 3, name: '감자', emoji: '🥔' },
  { id: 4, name: '고구마', emoji: '🍠' },
  { id: 5, name: '고추', emoji: '🌶️' },
  { id: 6, name: '단고추', emoji: '🫑' },
  { id: 7, name: '딸기', emoji: '🍓' },
  { id: 8, name: '포도', emoji: '🍇' },
  { id: 9, name: '땅콩', emoji: '🥜' },
  { id: 10, name: '마늘', emoji: '🧄' },
  { id: 11, name: '배', emoji: '🍐' },
  { id: 12, name: '배추', emoji: '🥬' },
  { id: 13, name: '복숭아', emoji: '🍑' },
  { id: 14, name: '수박', emoji: '🍉' },
  { id: 15, name: '쌀', emoji: '🌾' },
]

// 5️⃣ 파일 입력 엘리먼트 참조
// 왜? 사진찾기 버튼을 클릭하면 파일 선택 대화상자를 열기 위해
const fileInput = ref(null)

// 5️⃣-2 드래그 오버 상태
// 왜? 드래그 중일 때 시각적 피드백을 주기 위해
const isDragOver = ref(false)

// 6️⃣ 파일 처리 함수
// 왜? 파일을 읽어서 이미지로 변환하는 로직을 공통화하기 위해
function processFile(file) {
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result
      showResult.value = true
    }
    reader.readAsDataURL(file)
  }
}

// 6️⃣-2 사진 업로드 함수 (파일 선택)
// 왜? 사용자가 선택한 사진을 처리하기 위해
function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

// 6️⃣-3 드래그 앤 드롭 이벤트
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

  if (agreed.value === true) {
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      processFile(file)
    }
  }
}

// 7️⃣ 처음으로 돌아가는 함수
// 왜? 사용자가 다른 사진으로 다시 진단하고 싶을 때 초기 화면으로 돌아가기 위해
function resetToUpload() {
  uploadedImage.value = null
  showResult.value = false
  showDiagnosisResult.value = false
  selectedCrop.value = null
  diagnosisType.value = '병'
}

// 8️⃣ 진단 요청 함수
// 왜? 사용자가 "AI 영상진단 요청" 버튼을 클릭했을 때 진단 결과 화면으로 전환하고
//   진단 결과를 로컬에 저장해서 진단 이력에서 확인할 수 있게 함
function loadDiagnosisHistory() {
  try {
    return JSON.parse(localStorage.getItem('fd_diagnosis_history') || '[]')
  } catch (e) {
    return []
  }
}

function saveDiagnosisHistory(list) {
  localStorage.setItem('fd_diagnosis_history', JSON.stringify(list))
}

function addDiagnosisRecord(record) {
  const hist = loadDiagnosisHistory()
  hist.unshift(record) // newest first
  saveDiagnosisHistory(hist)
}

function requestDiagnosis() {
  showDiagnosisResult.value = true

  // create a simple diagnosis record and persist it
  const record = {
    id: Date.now(),
    date: new Date().toISOString(),
    diagnosisType: diagnosisType.value,
    selectedCrop: selectedCrop.value || null,
    // store image data URL if present
    image: uploadedImage.value || null,
    // snapshot of diagnosisData and selected tab
    diagnosisData: diagnosisData.map(d => ({ name: d.name, percentage: d.percentage, color: d.color })),
    selectedDiseaseTab: selectedDiseaseTab.value
  }

  try {
    addDiagnosisRecord(record)
  } catch (e) {
    console.error('진단 이력 저장 실패', e)
  }
}

// 9️⃣ 진단 결과 탭 관리
// 왜? 병명 탭과 정보 종류 탭을 각각 선택해서 해당 정보를 표시하기 위해
const selectedDiseaseTab = ref(0) // 0: 흰가루병, 1: 갈색무늬병
const selectedInfoTab = ref('발병원인') // '발병원인' | '발병 정보' | '방제 정보'

function infoColor(infoType) {
  if (infoType === '발병원인') return '#e94b5a'
  if (infoType === '발병 정보') return '#f59e0b'
  if (infoType === '방제 정보') return '#2d8a4f'
  return '#999'
}

const diagnosisData = [
  {
    name: '흰가루병',
    color: '#e94b5a',
    percentage: 92.5,
    cause: '고온 건조한 환경에서 발병',
    occurrence: '잎 표면에 하얀 가루 형태로 나타남',
    treatment: '발병 초기에 살균제를 살포하여 방제'
  },
  {
    name: '갈색무늬병',
    color: '#2d8a4f',
    percentage: 73.8,
    cause: '습도가 높은 환경에서 발병',
    occurrence: '잎에 갈색 무늬가 생김',
    treatment: '잎 앞뒤면에 충분히 묻도록 살포'
  }
]
</script>

<template>
  <div class="min-h-screen bg-page pl-56">
    <div class="h-1 bg-brand"></div>
    

    <div v-if="!showResult" class="px-5 py-7 max-w-shell mx-auto">
      <!-- Title -->
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">병해충 분석</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">AI 병해충 사진진단</div>
      </div>

      <!-- Consent box -->
      <div class="bg-white border border-gray-200 rounded-[10px] p-6 mb-6">
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1 flex flex-col gap-2.5">
            <div class="flex gap-2 text-[13px] text-gray-600 leading-relaxed">
              <span class="text-brand flex-shrink-0">▪</span>
              <span>해상도 1024×768 픽셀 이상의 사진으로 입력해 주세요. 저해상도 사진은 AI사진진단 정확도가 떨어집니다.</span>
            </div>
            <div class="flex gap-2 text-[13px] text-red-600 leading-relaxed font-medium">
              <span class="flex-shrink-0">▪</span>
              <span>본 진단결과는 참고용입니다. 오진의 가능성이 있으므로, 정확한 방제 처방은 전문가의 추가 검토가 필요합니다.</span>
            </div>
          </div>
          
        </div>

        <!-- Radio -->
        <div class="flex justify-center gap-8 mt-6 pt-5 border-t border-gray-100">
          <div class="flex items-center gap-2 cursor-pointer" @click="agreed = true">
            <div
              class="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center"
              :class="agreed === true ? 'border-[#ea580c]' : 'border-slate-300'"
            >
              <div v-if="agreed === true" class="w-[9px] h-[9px] rounded-full bg-[#ea580c]"></div>
            </div>
            <span
              class="text-sm"
              :class="agreed === true ? 'text-gray-900 font-medium' : 'text-gray-500'"
              >동의합니다</span
            >
          </div>
          <div class="flex items-center gap-2 cursor-pointer" @click="agreed = false">
            <div
              class="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center"
              :class="agreed === false ? 'border-[#ea580c]' : 'border-slate-300'"
            >
              <div v-if="agreed === false" class="w-[9px] h-[9px] rounded-full bg-[#ea580c]"></div>
            </div>
            <span
              class="text-sm"
              :class="agreed === false ? 'text-gray-900 font-medium' : 'text-gray-500'"
              >동의하지 않습니다</span
            >
          </div>
        </div>
      </div>

      <!-- Upload section -->
      <div class="bg-white border border-gray-200 rounded-[10px] p-6">
        <div class="text-center mb-5">
          <span class="text-base font-bold text-gray-900">진단 요청사진</span>
          <span class="text-[13px] text-gray-400 ml-2">- 사진진단 할 사진을 업로드 하세요.</span>
        </div>

        <div
          class="border-[1.5px] border-dashed rounded-[10px] p-12 text-center transition-all"
          :class="
            isDragOver
              ? 'border-brand bg-brand bg-opacity-5'
              : agreedYes
              ? 'border-slate-300 bg-[#fafbfc] opacity-100'
              : 'border-gray-200 bg-gray-50 opacity-60'
          "
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div
            class="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-brand-light rounded-xl"
          >
            <div class="w-[26px] h-[26px] border-2 border-brand rounded-md"></div>
          </div>
          <div class="text-gray-600 text-sm mb-1">
            AI 병해충 사진진단 할 사진을 여기에 끌어 놓거나
          </div>
          <div class="text-accent text-sm mb-5">사진찾기 버튼을 클릭하세요</div>
          <button
            :disabled="!agreedYes"
            class="px-6 py-2.5 text-white rounded-lg font-medium text-sm"
            :class="agreedYes ? 'bg-accent cursor-pointer' : 'bg-slate-300 cursor-not-allowed'"
            @click="fileInput?.click()"
          >
            사진찾기
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleImageUpload"
          />
        </div>

        <div v-if="agreed === false" class="text-center mt-4 text-[13px] text-red-600">
          먼저 위 약관에 동의해 주세요.
        </div>
      </div>
    </div>

    <!-- 분류선택 화면 -->
    <div v-if="showResult && !showDiagnosisResult" class="px-5 py-7 max-w-shell mx-auto">
      <div class="bg-white border border-gray-200 rounded-[10px] p-8">
        <div class="grid grid-cols-[1fr_1fr] gap-8">
          <!-- 왼쪽: 업로드된 사진 -->
          <div>
            <img
              :src="uploadedImage"
              alt="진단 사진"
              class="w-full rounded-lg object-cover border border-gray-200"
              style="aspect-ratio: 4/3"
            />
          </div>

          <!-- 오른쪽: 작물 선택 -->
          <div class="flex flex-col justify-between">
            <div>
              <!-- 제목 및 설명 -->
              <div class="mb-6">
                <div class="text-[15px] font-bold text-gray-900 mb-2">분류선택</div>
                <div class="text-sm text-gray-600">업로드한 사진의 작물을 선택 후 진단요청을 진행하세요.</div>
              </div>

              <!-- 작물 선택 그리드 -->
              <div class="mb-6">
                <div class="grid grid-cols-5 gap-3">
                  <button
                    v-for="crop in crops"
                    :key="crop.id"
                    @click="selectedCrop = crop.id"
                    class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border-2"
                    :class="
                      selectedCrop === crop.id
                        ? 'bg-brand bg-opacity-10 border-brand'
                        : 'border-gray-200 hover:border-gray-300'
                    "
                  >
                    <div class="text-3xl">{{ crop.emoji }}</div>
                    <div class="text-xs font-medium text-gray-700 text-center leading-tight">{{ crop.name }}</div>
                  </button>
                </div>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="flex gap-3">
              <button
                @click="resetToUpload"
                class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                사진 재선택
              </button>
              <button
                @click="requestDiagnosis"
                class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
              >
                AI 진단 요청
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 진단 결과 화면 -->
    <div v-if="showDiagnosisResult" class="px-5 py-7 max-w-shell mx-auto">
      <div class="bg-white border border-gray-200 rounded-[10px] p-8">
        <!-- 제목 -->
        <div class="mb-6">
          <div class="text-[15px] font-bold text-gray-900 mb-2">병해충 진단을 완료하였습니다.</div>
        </div>

        <!-- 진단 결과 카드 -->
        <div class="grid grid-cols-[1fr_1fr] gap-8 mb-8">
          <!-- 왼쪽: 사진 -->
          <div class="flex items-center justify-center">
            <img
              :src="uploadedImage"
              alt="진단 사진"
              class="w-full rounded-lg object-cover border border-gray-200"
              style="aspect-ratio: 4/3"
            />
          </div>

          <!-- 오른쪽: 진단 결과 -->
          <div>
            <!-- 진단 결과 -->
            <div class="mb-6">
              <div class="space-y-4">
                <div v-for="(data, idx) in diagnosisData" :key="idx">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: data.color }"></div>
                      <span class="text-sm font-medium text-gray-900">{{ data.name }}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-900">{{ data.percentage }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full" :style="{ backgroundColor: data.color, width: data.percentage + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 버튼 -->
            <div class="mt-8">
              <button
                @click="showDiagnosisResult = false"
                class="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                이전으로
              </button>
            </div>
          </div>
        </div>

        <!-- 상세 정보 -->
        <div class="border-t border-gray-200 pt-8">
          <!-- 병명 탭 -->
          <div class="mb-8">
            <div class="flex gap-3 mb-6">
              <button
                v-for="(data, idx) in diagnosisData"
                :key="idx"
                @click="selectedDiseaseTab = idx"
                class="px-6 py-3 rounded-lg font-semibold text-sm transition-all border"
                :class="
                  selectedDiseaseTab === idx
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                "
              >
                {{ data.name }}
              </button>
            </div>

            <!-- 정보 종류 탭 -->
            <div class="flex gap-3 mb-6">
              <button
                v-for="infoType in ['발병원인', '발병 정보', '방제 정보']"
                :key="infoType"
                @click="selectedInfoTab = infoType"
                class="px-5 py-2 rounded-full font-medium text-sm transition-colors"
                :class="selectedInfoTab === infoType ? 'text-white' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'"
                :style="selectedInfoTab === infoType ? { backgroundColor: infoColor(infoType) } : null"
              >
                {{ infoType }}
              </button>
            </div>

            <!-- 선택된 정보 표시 -->
            <div class="bg-gray-50 rounded-lg p-6">
              <div class="space-y-3">
                <div v-if="selectedInfoTab === '발병원인'" class="text-sm text-gray-700 leading-relaxed">
                  <div class="font-medium text-gray-900 mb-2">{{ diagnosisData[selectedDiseaseTab].name }} 발병원인</div>
                  <div>• {{ diagnosisData[selectedDiseaseTab].cause }}</div>
                </div>

                <div v-if="selectedInfoTab === '발병 정보'" class="text-sm text-gray-700 leading-relaxed">
                  <div class="font-medium text-gray-900 mb-2">{{ diagnosisData[selectedDiseaseTab].name }} 발병 정보</div>
                  <div>• {{ diagnosisData[selectedDiseaseTab].occurrence }}</div>
                </div>

                <div v-if="selectedInfoTab === '방제 정보'" class="text-sm text-gray-700 leading-relaxed">
                  <div class="font-medium text-gray-900 mb-2">{{ diagnosisData[selectedDiseaseTab].name }} 방제 정보</div>
                  <div>• {{ diagnosisData[selectedDiseaseTab].treatment }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FloatingChatButton />
  </div>
</template>
