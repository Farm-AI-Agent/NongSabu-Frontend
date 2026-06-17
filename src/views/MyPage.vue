<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
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

const isEditMode = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const showRegionModal = ref(false)
const selectedProvince = ref(null)
const crops = ref([])
const persistedUserCrops = ref([])

const provinces = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
]

const citiesByProvince = {
  '서울': ['서울'],
  '부산': ['부산'],
  '대구': ['대구'],
  '인천': ['인천'],
  '광주': ['광주'],
  '대전': ['대전'],
  '울산': ['울산'],
  '경기': ['수원', '성남', '의정부', '안양', '부천', '광명', '평택', '동두천', '안산', '고양', '과천', '구리', '남양주', '오산', '시흥', '군포', '의왕', '하남', '여주', '이천', '광주', '양주', '포천', '김포', '화성', '용인'],
  '강원': ['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'],
  '충북': ['청주', '충주', '제천', '음성', '영동', '진천', '괴산', '증평', '단양'],
  '충남': ['천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '예산', '태안'],
  '전북': ['전주', '군산', '익산', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'],
  '전남': ['목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '완도', '진도', '신안'],
  '경북': ['포항', '경주', '김천', '안동', '구미', '영천', '영주', '상주', '문경', '예천', '봉화', '울진', '울릉'],
  '경남': ['창원', '마산', '진해', '통영', '사천', '김해', '밀양', '거제', '남해', '하동', '산청', '함양', '거창', '합천'],
  '제주': ['제주시', '서귀포시'],
}

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

const experienceLabel = computed(
  () => EXPERIENCE_OPTIONS.find((option) => option.value === profile.experienceLevel)?.label || '미설정',
)

const farmInfo = computed(() => [
  { label: '농장명', value: profile.farmName || '미설정' },
  { label: '지역', value: profile.region || '미설정' },
  { label: '주요 작물', value: selectedCropNames.value },
  { label: '경험', value: experienceLabel.value },
  { label: '농장 규모', value: profile.farmSize || '미설정' },
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

  profile.name = member.name
  profile.email = member.email
  profile.region = farmProfile?.region || farm?.location || ''
  profile.farmName = farm?.name || ''
  profile.farmSize = farmProfile?.farmSize || farm?.cultivationArea || ''
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
  selectedProvince.value = null
}

function closeRegionModal() {
  showRegionModal.value = false
  selectedProvince.value = null
}

function selectProvince(province) {
  selectedProvince.value = province
}

function selectCity(city) {
  const province = selectedProvince.value
  profile.region = `${province} ${city}`
  closeRegionModal()
}

function goBackToProvince() {
  selectedProvince.value = null
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

    await apiRequest('/api/v1/farms/me', {
      method: 'PUT',
      token,
      body: {
        name: profile.farmName,
        location: profile.region,
        cultivationArea: profile.farmSize,
        notes: '',
      },
    })

    const farmProfilePayload = {
      region: profile.region,
      experienceLevel: profile.experienceLevel,
      farmSize: profile.farmSize,
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
  }
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

    <div class="px-5 py-7 mx-auto ml-64 pt-20" style="max-width: 760px">
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
              <input
                v-model="profile.farmSize"
                type="text"
                placeholder="예시: 660제곱미터"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
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
    </div>

    <!-- Region Selection Modal -->
    <div v-if="showRegionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4">
        <!-- Province Selection Screen -->
        <template v-if="!selectedProvince">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-lg font-bold text-gray-900">도 선택</h2>
          </div>
          <div class="p-6 max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="province in provinces"
                :key="province"
                @click="selectProvince(province)"
                class="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand hover:text-white hover:border-brand transition-colors"
              >
                {{ province }}
              </button>
            </div>
          </div>
          <div class="p-4 border-t border-gray-200 flex justify-end">
            <button
              @click="closeRegionModal"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </template>

        <!-- City Selection Screen -->
        <template v-else>
          <div class="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900">{{ selectedProvince }} 선택</h2>
            <button
              @click="goBackToProvince"
              class="text-2xl leading-none text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
            >
              ‹
            </button>
          </div>
          <div class="p-6 max-h-[60vh] overflow-y-auto">
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="city in citiesByProvince[selectedProvince]"
                :key="city"
                @click="selectCity(city)"
                class="px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand hover:text-white hover:border-brand transition-colors"
              >
                {{ city }}
              </button>
            </div>
          </div>
          <div class="p-4 border-t border-gray-200 flex justify-between">
            <button
              @click="goBackToProvince"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              이전
            </button>
            <button
              @click="closeRegionModal"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>