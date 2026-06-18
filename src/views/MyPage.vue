<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import AppFooter from '../components/AppFooter.vue'
import RegionPickerModal from '../components/RegionPickerModal.vue'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER', label: '초보 농사꾼' },
  { value: 'INTERMEDIATE', label: '경험 있는 농사꾼' },
  { value: 'ADVANCED', label: '고급 농사꾼' },
]

const router = useRouter()
const { accessToken, fetchMyProfile, logout } = useAuth()
const { setFarmLocation, clearFarmLocation } = useFarmProfileState()

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

const isEditMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showRegionModal = ref(false)
const crops = ref([])
const persistedUserCrops = ref([])
const showInfoModal = ref(false)
const infoModalType = ref(null) // 'support' 또는 'policy'

const profile = reactive({
  name: '',
  email: '',
  region: '',
  farmName: '',
  farmSize: '',
  experienceLevel: 'BEGINNER',
  selectedCropIds: [],
  mainCropId: null,
  joinDate: '',
})

const selectedCropNames = computed(() => {
  if (!profile.selectedCropIds.length) {
    return '선택된 작물이 없습니다'
  }

  return profile.selectedCropIds
    .map((cropId) => crops.value.find((item) => item.id === cropId)?.name)
    .filter(Boolean)
    .join(', ')
})

const farmSizeDisplay = computed(() => {
  const num = Number(profile.farmSize)
  if (!num || num <= 0 || Number.isNaN(num)) return ''
  const pyeong = Math.round((num / 3.3058) * 100) / 100
  return `${num}제곱미터 (${pyeong}평)`
})

const experienceLabel = computed(
  () => EXPERIENCE_OPTIONS.find((option) => option.value === profile.experienceLevel)?.label || '미설정',
)

const farmInfo = computed(() => [
  { label: '농장명', value: profile.farmName || '미설정' },
  { label: '지역', value: profile.region || '미설정' },
  { label: '주요 작물', value: selectedCropNames.value },
  { label: '경험', value: experienceLabel.value },
  { label: '농장 규모', value: farmSizeDisplay.value || '미설정' },
  { label: '가입일', value: profile.joinDate || '미설정' },
])

function getToken() {
  if (!accessToken.value) {
    throw new ApiError('Authentication token is missing.')
  }
  return accessToken.value
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

function formatFarmSize(num) {
  const parsedNum = Number(num)
  if (!parsedNum || parsedNum <= 0 || Number.isNaN(parsedNum)) return ''
  const pyeong = Math.round((parsedNum / 3.3058) * 100) / 100
  return `${parsedNum}제곱미터 (${pyeong}평)`
}

async function requestOrNull(path, options) {
  try {
    return await apiRequest(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

function applyLoadedData({ member, farm, farmProfile, userCrops: userCropList, cropList }) {
  crops.value = cropList
  persistedUserCrops.value = userCropList

  const selectedCropIds = userCropList.length
    ? userCropList.map((item) => item.cropId)
    : farmProfile?.mainCropId
      ? [farmProfile.mainCropId]
      : []

  // 저장된 farmSize에서 숫자만 추출 (예: "660제곱미터 (200평)" -> "660")
  const savedFarmSize = farmProfile?.farmSize || farm?.cultivationArea || ''
  const farmSizeMatch = savedFarmSize.match(/(\d+)/)
  const extractedFarmSize = farmSizeMatch ? farmSizeMatch[1] : ''

  profile.name = member.name
  profile.email = member.email
  profile.region = farmProfile?.region || farm?.location || ''
  profile.farmName = farm?.name || ''
  profile.farmSize = extractedFarmSize
  profile.experienceLevel = farmProfile?.experienceLevel || 'BEGINNER'
  profile.selectedCropIds = selectedCropIds
  profile.mainCropId = farmProfile?.mainCropId || selectedCropIds[0] || null
  profile.joinDate = formatDate(member.createdAt)

  setFarmLocation(profile.region)
}

async function loadProfile() {
  resetMessages()
  isLoading.value = true

  try {
    const token = getToken()
    const member = await fetchMyProfile(token)
    const [farm, farmProfile, userCropList, cropList] = await Promise.all([
      requestOrNull('/api/v1/farms/me', { token }),
      requestOrNull('/api/v1/farm-profiles/me', { token }),
      apiRequest('/api/v1/user-crops/me', { token }),
      apiRequest('/api/v1/crops', { token }),
    ])

    applyLoadedData({ member, farm, farmProfile, userCrops: userCropList, cropList })
  } catch (error) {
    errorMessage.value = error?.message || '농장 프로필을 불러올 수 없습니다.'
  } finally {
    isLoading.value = false
  }
}

function startEdit() {
  resetMessages()
  isEditMode.value = true
}

function openRegionModal() {
  showRegionModal.value = true
}

function closeRegionModal() {
  showRegionModal.value = false
}

function selectRegion(region) {
  profile.region = region
  closeRegionModal()
}

async function syncUserCrops(token) {
  const currentByCropId = new Map(persistedUserCrops.value.map((item) => [item.cropId, item]))
  const selectedCropSet = new Set(profile.selectedCropIds)

  const deleteTargets = persistedUserCrops.value.filter((item) => !selectedCropSet.has(item.cropId))
  const createTargets = profile.selectedCropIds.filter((cropId) => !currentByCropId.has(cropId))

  await Promise.all(
    deleteTargets.map((item) =>
      apiRequest(`/api/v1/user-crops/${item.id}`, {
        method: 'DELETE',
        token,
      }),
    ),
  )

  for (const cropId of createTargets) {
    await apiRequest('/api/v1/user-crops', {
      method: 'POST',
      token,
      body: {
        cropId,
        cultivationArea: profile.farmSize,
        memo: '',
      },
    })
  }
}

async function saveProfile() {
  resetMessages()

  if (!profile.region.trim()) {
    errorMessage.value = '지역을 입력해주세요.'
    return
  }

  if (!profile.farmName.trim()) {
    errorMessage.value = '농장명을 입력해주세요.'
    return
  }

  if (!profile.farmSize.trim()) {
    errorMessage.value = '농장 규모를 입력해주세요.'
    return
  }

  if (!profile.selectedCropIds.length) {
    errorMessage.value = '최소한 하나의 작물을 선택해주세요.'
    return
  }

  if (!profile.mainCropId || !profile.selectedCropIds.includes(profile.mainCropId)) {
    profile.mainCropId = profile.selectedCropIds[0]
  }

  isSaving.value = true

  try {
    const token = getToken()
    const formattedFarmSize = formatFarmSize(profile.farmSize)

    await apiRequest('/api/v1/farms/me', {
      method: 'PUT',
      token,
      body: {
        name: profile.farmName,
        location: profile.region,
        cultivationArea: formattedFarmSize,
        notes: '',
      },
    })

    const farmProfilePayload = {
      region: profile.region,
      experienceLevel: profile.experienceLevel,
      farmSize: formattedFarmSize,
      mainCropId: profile.mainCropId,
    }

    try {
      await apiRequest('/api/v1/farm-profiles/me', {
        method: 'PUT',
        token,
        body: farmProfilePayload,
      })
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error
      }

      await apiRequest('/api/v1/farm-profiles/me', {
        method: 'POST',
        token,
        body: farmProfilePayload,
      })
    }

    await syncUserCrops(token)
    await loadProfile()

    isEditMode.value = false
    successMessage.value = '농장 프로필이 저장되었습니다.'
  } catch (error) {
    errorMessage.value = error?.message || '농장 프로필 저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

function cancelEdit() {
  isEditMode.value = false
  loadProfile()
}

function toggleCrop(cropId) {
  if (profile.selectedCropIds.includes(cropId)) {
    profile.selectedCropIds = profile.selectedCropIds.filter((id) => id !== cropId)
    if (profile.mainCropId === cropId) {
      profile.mainCropId = profile.selectedCropIds[0] || null
    }
    return
  }

  profile.selectedCropIds = [...profile.selectedCropIds, cropId]
  if (!profile.mainCropId) {
    profile.mainCropId = cropId
  }
}

function handleFarmSizeInput(e) {
  const value = e.target.value
  const numOnly = value.replace(/\D/g, '')
  profile.farmSize = numOnly
}

function onLogout() {
  clearFarmLocation()
  logout()
  router.push('/')
}

function handleMenuClick(item) {
  if (item === '관심 사업') {
    router.push('/favorites')
    return
  }

  if (item === '진단 이력') {
    router.push('/diagnosis-history')
    return
  }

  if (item === '문의 및 지원') {
    infoModalType.value = 'support'
    showInfoModal.value = true
    return
  }

  if (item === '이용약관 및 정책') {
    infoModalType.value = 'policy'
    showInfoModal.value = true
    return
  }
}

function closeInfoModal() {
  showInfoModal.value = false
  infoModalType.value = null
}

const menuItems = ['알림 설정', '진단 이력', '관심 사업', '문의 및 지원', '이용약관 및 정책']

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <Sidebar />

    <div class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col" style="max-width: 760px">
      <div v-if="isLoading" class="bg-white border border-gray-200 rounded-xl p-7 text-sm text-gray-500">
        농장 프로필을 불러오는 중입니다...
      </div>

      <template v-else>
        <div class="mb-6">
          <div class="text-[26px] font-bold text-gray-900 tracking-tight">
            {{ isEditMode ? '농장 프로필 편집' : '마이페이지' }}
          </div>
        </div>

        <div v-if="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ successMessage }}
        </div>

        <template v-if="!isEditMode">
          <div class="bg-white border border-gray-200 rounded-xl p-7 mb-5 flex items-center gap-5 flex-wrap">
            <div class="w-[72px] h-[72px] bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-bold text-[28px] flex-shrink-0">
              {{ profile.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-[180px]">
              <div class="text-xl font-bold text-gray-900 mb-1">{{ profile.name }}</div>
              <div class="text-[13px] text-gray-400">{{ profile.email }} · {{ profile.region || 'Region not set' }}</div>
            </div>
            <button
              @click="startEdit"
              class="px-[1.1rem] py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
            >
              프로필 수정
            </button>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-[1.25rem_1.5rem] mb-5">
            <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center gap-2">
              <div class="w-1 h-4 bg-brand rounded-sm"></div>
              농장 정보
            </div>
            <div
              v-for="(row, i) in farmInfo"
              :key="row.label"
              class="flex justify-between py-3 gap-6"
              :class="i > 0 ? 'border-t border-gray-100' : ''"
            >
              <div class="text-sm text-gray-500">{{ row.label }}</div>
              <div class="text-sm text-gray-900 font-medium text-right">{{ row.value }}</div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="bg-white border border-gray-200 rounded-xl p-7 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">이름</label>
              <input
                :value="profile.name"
                type="text"
                disabled
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">이메일</label>
              <input
                :value="profile.email"
                type="email"
                disabled
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">농장명</label>
              <input
                v-model="profile.farmName"
                type="text"
                placeholder="농장명을 입력해주세요"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">지역</label>
              <button
                type="button"
                @click="openRegionModal"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-left focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand bg-white hover:bg-gray-50 transition-colors"
              >
                {{ profile.region || '지역을 선택해주세요' }}
              </button>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">경험</label>
              <select
                v-model="profile.experienceLevel"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option v-for="option in EXPERIENCE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">농장 규모</label>
              <div class="space-y-2">
                <input
                  :value="profile.farmSize"
                  @input="handleFarmSizeInput"
                  type="text"
                  placeholder="숫자만 입력해주세요 (예: 660)"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
                <div v-if="farmSizeDisplay" class="text-sm text-gray-500">
                  {{ farmSizeDisplay }}
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between gap-3 mb-3">
                <label class="block text-sm font-medium text-gray-900">재배 작물</label>
                <span class="text-xs text-gray-400">선택된 주요 작물은 농장 프로필에도 사용됩니다.</span>
              </div>
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <button
                  v-for="crop in crops"
                  :key="crop.id"
                  type="button"
                  @click="toggleCrop(crop.id)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border-2"
                  :class="profile.selectedCropIds.includes(crop.id) ? 'bg-brand/10 border-brand' : 'border-gray-200 hover:border-gray-300'"
                >
                  <div class="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center text-3xl shadow-sm">
                    {{ getCropEmoji(crop.name) }}
                  </div>
                  <div class="text-sm font-semibold text-gray-700 text-center leading-tight">{{ crop.name }}</div>
                  <div
                    v-if="profile.mainCropId === crop.id"
                    class="text-[11px] px-2 py-1 rounded-full bg-brand text-white"
                  >
                    주요 작물
                  </div>
                </button>
              </div>
            </div>

            <div v-if="profile.selectedCropIds.length">
              <label class="block text-sm font-medium text-gray-900 mb-2">주요 작물</label>
              <select
                v-model.number="profile.mainCropId"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option v-for="cropId in profile.selectedCropIds" :key="cropId" :value="cropId">
                  {{ crops.find((item) => item.id === cropId)?.name || cropId }}
                </option>
              </select>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                @click="cancelEdit"
                class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                @click="saveProfile"
                class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-60"
                :disabled="isSaving"
              >
                {{ isSaving ? '저장 중...' : '저장' }}
              </button>
            </div>
          </div>
        </template>

        <template v-if="!isEditMode">
          <div class="bg-white border border-gray-200 rounded-xl py-2 mb-5">
            <div
              v-for="(item, i) in menuItems"
              :key="item"
              class="flex justify-between items-center px-6 py-4 cursor-pointer"
              :class="i > 0 ? 'border-t border-gray-100' : ''"
              @click="handleMenuClick(item)"
            >
              <div class="text-sm text-gray-900">{{ item }}</div>
              <div class="text-base text-slate-300">></div>
            </div>
          </div>

          <button
            class="w-full py-3.5 bg-white border border-gray-200 rounded-[10px] text-sm text-red-600 font-medium"
            @click="onLogout"
          >
            로그아웃
          </button>
        </template>
      </template>

      <AppFooter />
    </div>

    <RegionPickerModal
      v-if="showRegionModal"
      @close="closeRegionModal"
      @select="selectRegion"
    />

    <!-- Info Modal (Support & Policy) -->
    <div v-if="showInfoModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900">
            {{ infoModalType === 'support' ? '문의 및 지원' : '이용약관 및 정책' }}
          </h2>
          <button
            @click="closeInfoModal"
            class="text-2xl text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Support Content -->
          <template v-if="infoModalType === 'support'">
            <div>
              <h3 class="text-base font-bold text-gray-900 mb-3">자주 묻는 질문</h3>
              <div class="space-y-4">
                <div class="border-l-4 border-brand pl-4">
                  <h4 class="font-medium text-gray-900 mb-1">Q: 분석 결과는 얼마나 신뢰할 수 있나요?</h4>
                  <p class="text-sm text-gray-600">A: 업로드한 이미지는 실제 분석 모델 API로 전달되며, 화면은 백엔드에서 내려온 진단 결과와 안내 메시지를 기준으로 표시됩니다.</p>
                </div>
                <div class="border-l-4 border-brand pl-4">
                  <h4 class="font-medium text-gray-900 mb-1">Q: 지원하는 작물은 무엇인가요?</h4>
                  <p class="text-sm text-gray-600">A: 선택 가능한 작물 목록은 백엔드 작물 API 기준으로 표시됩니다. 실제 분석 지원 범위는 모델 연동 상태에 따라 달라질 수 있습니다.</p>
                </div>
                <div class="border-l-4 border-brand pl-4">
                  <h4 class="font-medium text-gray-900 mb-1">Q: 내 분석 데이터는 안전한가요?</h4>
                  <p class="text-sm text-gray-600">A: 모든 사용자 데이터는 암호화되어 저장되며, 개인정보는 보호됩니다. 자세한 사항은 개인정보처리방침을 참고해주세요.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-base font-bold text-gray-900 mb-3">기술 지원</h3>
              <p class="text-sm text-gray-600 mb-4">문제가 발생하거나 도움이 필요하신 경우 아래로 연락해주세요.</p>
              <div class="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><span class="font-medium text-gray-900">이메일:</span> <span class="text-gray-600">support@nongsabu.com</span></p>
                <p><span class="font-medium text-gray-900">전화:</span> <span class="text-gray-600">02-1234-5678</span></p>
                <p><span class="font-medium text-gray-900">운영시간:</span> <span class="text-gray-600">월-금 09:00~18:00</span></p>
              </div>
            </div>
          </template>

          <!-- Policy Content -->
          <template v-else>
            <div>
              <h3 class="text-base font-bold text-gray-900 mb-3">서비스 이용약관</h3>
              <div class="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p><span class="font-medium text-gray-900">제1조 (목적)</span><br>본 약관은 농사부(이하 "회사")가 제공하는 AI 병해충 진단 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                <p><span class="font-medium text-gray-900">제2조 (약관의 효력 및 변경)</span><br>이 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 회사는 필요시 약관을 변경할 수 있으며, 변경된 약관은 공지로 15일 이후부터 적용됩니다.</p>
                <p><span class="font-medium text-gray-900">제3조 (서비스의 이용)</span><br>회원은 본 약관에 따라 서비스를 이용할 수 있습니다. 불법적인 목적으로 서비스를 이용할 수 없으며, 회사가 판단하기에 서비스 이용이 부적절하다고 판단되는 경우 이용을 제한할 수 있습니다.</p>
              </div>
            </div>

            <div>
              <h3 class="text-base font-bold text-gray-900 mb-3">개인정보처리방침</h3>
              <div class="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p><span class="font-medium text-gray-900">수집하는 개인정보</span><br>회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다: 이름, 이메일, 전화번호, 농장 정보, 업로드된 이미지.</p>
                <p><span class="font-medium text-gray-900">정보의 사용</span><br>수집된 정보는 서비스 제공, 사용자 지원, 서비스 개선을 목적으로만 사용됩니다.</p>
                <p><span class="font-medium text-gray-900">정보보호</span><br>모든 개인정보는 SSL 암호화 기술로 보호되며, 무단 접근을 방지하기 위해 적절한 보안 조치를 취합니다.</p>
                <p><span class="font-medium text-gray-900">정보 삭제</span><br>사용자는 언제든지 개인정보의 삭제를 요청할 수 있으며, 계정 삭제 시 관련 정보는 30일 내에 삭제됩니다.</p>
              </div>
            </div>
          </template>
        </div>

        <div class="border-t border-gray-200 p-6 flex justify-end">
          <button
            @click="closeInfoModal"
            class="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
