<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RegionPickerModal from '../components/RegionPickerModal.vue'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'
import { fetchPolicyPrograms, savePolicyOnboarding, syncPolicyOnboardingToUserProfile } from '../lib/policyApi'

const route = useRoute()
const router = useRouter()
const { accessToken } = useAuth()
const { setFarmLocation } = useFarmProfileState()

const STORAGE_KEY = 'fd_policy_onboarding_draft'

const started = ref(false)
const currentIndex = ref(0)
const isSaving = ref(false)
const isLoadingPolicies = ref(false)
const errorMessage = ref('')
const savedEndpoint = ref('')
const primaryCropCustom = ref('')
const secondaryCropCustom = ref('')
const receivedPolicySearch = ref('')
const receivedPolicyCustom = ref('')
const policyOptions = ref([])
const activeRegionKey = ref('')
const showRegionModal = ref(false)

const answers = reactive({
  age: '',
  young_farmer_eligible: null,
  farming_start_year: '',
  farming_type: '',
  residence_region: '',
  farmland_region: '',
  primary_crop_name: '',
  secondary_crop_names: [],
  cultivation_area: '',
  cultivation_type: '',
  applicant_type: '',
  registered_farm_business: null,
  annual_sales_range: '',
  desired_support_types: [],
  self_contribution_available: null,
  received_policy_names: [],
  application_period_preference: '',
})

const cropOptions = ['토마토', '딸기', '오이', '상추', '배추', '고추', '당근', '옥수수', '포도', '배', '사과', '수박', '멜론', '양파']

const farmingTypeOptions = [
  { value: '전업농', description: '농업을 주된 직업과 소득원으로 하는 형태입니다.' },
  { value: '겸업농', description: '농업 외 직업이나 소득 활동을 함께 하는 형태입니다.' },
  { value: '예비농', description: '아직 본격 영농 전이지만 창업이나 귀농을 준비하는 단계입니다.' },
  { value: '농업법인', description: '농업회사법인, 영농조합법인처럼 법인 형태로 운영하는 경우입니다.' },
  { value: '가족농', description: '가족 구성원이 함께 농장을 운영하는 형태입니다.' },
]

const cultivationTypeOptions = [
  { value: '노지', description: '비닐하우스나 온실 없이 야외 농지에서 재배하는 방식입니다.' },
  { value: '시설', description: '비닐하우스, 온실 등 시설 안에서 재배하는 방식입니다.' },
  { value: '스마트팜', description: '센서, 제어기, 데이터 기반 환경 관리 설비를 활용하는 방식입니다.' },
  { value: '수경재배', description: '흙 대신 배양액과 물을 이용해 작물을 키우는 방식입니다.' },
  { value: '친환경', description: '친환경 인증이나 저농약·무농약 기준에 맞춰 재배하는 방식입니다.' },
]

const applicantTypeOptions = [
  { value: '개인 농업인', description: '개인 명의로 농업을 운영하고 신청하는 경우입니다.' },
  { value: '농업법인', description: '농업회사법인 등 법인 명의로 신청하는 경우입니다.' },
  { value: '작목반', description: '같은 작물을 재배하는 농가 모임 단위로 신청하는 경우입니다.' },
  { value: '영농조합', description: '영농조합법인이나 공동 영농 조직으로 신청하는 경우입니다.' },
  { value: '예비창업자', description: '농업 창업을 준비 중이며 아직 운영 이력이 적은 경우입니다.' },
]

const questions = [
  {
    key: 'age',
    title: '나이를 알려주실 수 있나요?',
    description: '청년농, 후계농 등 나이 조건이 있는 정책을 먼저 걸러낼 수 있어요.',
    helper: '청년농은 보통 젊은 농업인이나 농업 창업 예정자를 대상으로 하는 정책 구분입니다. 세부 나이 기준은 사업마다 다를 수 있어요.',
    type: 'number',
    placeholder: '예: 34',
    suffix: '세',
  },
  {
    key: 'young_farmer_eligible',
    title: '청년농 조건에 해당한다고 생각하시나요?',
    description: '청년농 우대 정책이나 별도 신청 트랙을 추천하는 데 사용합니다.',
    helper: '정확한 기준을 모르겠다면 건너뛰어도 됩니다. 나이와 영농 시작 연도를 함께 보고 추천에서 다시 보정할 수 있어요.',
    type: 'boolean',
  },
  {
    key: 'farming_start_year',
    title: '농사를 시작한 연도는 언제인가요?',
    description: '영농 경력 조건이 있는 정책과 맞는지 확인합니다.',
    type: 'number',
    placeholder: '예: 2022',
    suffix: '년',
  },
  {
    key: 'farming_type',
    title: '현재 농업 형태는 무엇에 가깝나요?',
    description: '전업, 겸업, 법인 등 신청 자격이 나뉘는 정책을 구분합니다.',
    type: 'single',
    options: farmingTypeOptions,
  },
  {
    key: 'residence_region',
    title: '거주 지역은 어디인가요?',
    description: '거주지 기준으로 제한되는 지자체 정책을 찾습니다.',
    type: 'region',
    placeholder: '지역을 선택해주세요',
  },
  {
    key: 'farmland_region',
    title: '농지 지역은 어디인가요?',
    description: '농지 소재지 기준으로 신청 가능한 지역 정책을 찾습니다.',
    type: 'region',
    placeholder: '지역을 선택해주세요',
  },
  {
    key: 'primary_crop_name',
    title: '가장 주력으로 재배하는 작물은 무엇인가요?',
    description: '작물별 지원사업과 교육, 시설 지원을 우선 추천합니다.',
    type: 'crop-single',
    options: cropOptions,
    placeholder: '목록에 없으면 직접 입력',
  },
  {
    key: 'secondary_crop_names',
    title: '함께 재배하는 작물이 있다면 알려주세요.',
    description: '여러 작물에 걸친 지원사업을 놓치지 않도록 확인합니다.',
    type: 'crop-multi',
    options: cropOptions,
    placeholder: '목록에 없으면 직접 입력 후 추가',
  },
  {
    key: 'cultivation_area',
    title: '재배 면적은 어느 정도인가요?',
    description: '면적 조건이나 지원 한도가 있는 사업을 맞춰볼 수 있어요.',
    type: 'number',
    placeholder: '예: 1200',
    suffix: '㎡',
  },
  {
    key: 'cultivation_type',
    title: '재배 방식은 무엇인가요?',
    description: '시설, 노지, 스마트팜 등 방식별 지원 항목을 구분합니다.',
    type: 'single',
    options: cultivationTypeOptions,
  },
  {
    key: 'applicant_type',
    title: '신청자 유형은 어디에 가까운가요?',
    description: '개인, 법인, 공동체 등 신청 주체 조건을 확인합니다.',
    type: 'single',
    options: applicantTypeOptions,
  },
  {
    key: 'registered_farm_business',
    title: '농업경영체 등록이 되어 있나요?',
    description: '농업경영체 등록이 필수인 정책을 미리 구분합니다.',
    helper: '농업경영체 등록은 농업인 또는 농업법인의 기본 정보를 행정기관에 등록하는 절차입니다. 많은 보조사업의 기본 자격으로 쓰입니다.',
    type: 'boolean',
  },
  {
    key: 'annual_sales_range',
    title: '연 매출 규모는 어느 정도인가요?',
    description: '소규모 농가, 성장 농가 등 규모별 지원 정책을 추천합니다.',
    type: 'single',
    options: ['1천만원 미만', '1천만원~5천만원', '5천만원~1억원', '1억원 이상', '아직 매출 없음'],
  },
  {
    key: 'desired_support_types',
    title: '관심 있는 지원 분야를 골라주세요.',
    description: '원하는 지원 성격에 맞춰 정책 추천 우선순위를 조정합니다.',
    type: 'multi',
    options: ['자금 지원', '시설·장비', '교육·컨설팅', '판로·마케팅', '인증', '청년농', '스마트팜'],
  },
  {
    key: 'self_contribution_available',
    title: '자부담이 필요한 사업도 신청 가능하신가요?',
    description: '자부담 조건이 있는 보조사업을 추천할지 판단합니다.',
    type: 'boolean',
  },
  {
    key: 'received_policy_names',
    title: '이미 받은 지원사업이 있나요?',
    description: '중복 수혜 제한이 있는 정책을 피하는 데 도움이 됩니다.',
    type: 'policy-search',
    placeholder: '지원사업명 키워드로 검색',
  },
  {
    key: 'application_period_preference',
    title: '언제 신청 가능한 정책을 보고 싶나요?',
    description: '지금 바로 신청 가능한 사업과 준비 기간이 필요한 사업을 구분합니다.',
    type: 'single',
    options: ['상시 신청', '이번 달 마감', '3개월 이내', '올해 안', '기간 상관없음'],
  },
]

const currentQuestion = computed(() => questions[currentIndex.value])
const progressPercent = computed(() => Math.round((currentIndex.value / questions.length) * 100))
const remainingCount = computed(() => Math.max(questions.length - currentIndex.value - 1, 0))
const isLastQuestion = computed(() => currentIndex.value === questions.length - 1)
const filteredPolicyOptions = computed(() => {
  const keyword = receivedPolicySearch.value.trim().toLowerCase()
  const source = policyOptions.value.filter((name) => !answers.received_policy_names.includes(name))

  if (!keyword) {
    return source.slice(0, 6)
  }

  return source.filter((name) => name.toLowerCase().includes(keyword)).slice(0, 6)
})

function optionValue(option) {
  return typeof option === 'string' ? option : option.value
}

function optionDescription(option) {
  return typeof option === 'string' ? '' : option.description
}

function toggleMulti(key, option) {
  const selected = answers[key]
  const value = optionValue(option)
  const index = selected.indexOf(value)

  if (index >= 0) {
    selected.splice(index, 1)
  } else {
    selected.push(value)
  }
}

function addSecondaryCustomCrop() {
  const cropName = secondaryCropCustom.value.trim()

  if (!cropName || answers.secondary_crop_names.includes(cropName)) {
    secondaryCropCustom.value = ''
    return
  }

  answers.secondary_crop_names.push(cropName)
  secondaryCropCustom.value = ''
}

function addReceivedPolicy(policyName) {
  const nextPolicyName = String(policyName).trim()

  if (!nextPolicyName || answers.received_policy_names.includes(nextPolicyName)) {
    receivedPolicyCustom.value = ''
    receivedPolicySearch.value = ''
    return
  }

  answers.received_policy_names.push(nextPolicyName)
  receivedPolicyCustom.value = ''
  receivedPolicySearch.value = ''
}

function removeListValue(key, value) {
  const index = answers[key].indexOf(value)

  if (index >= 0) {
    answers[key].splice(index, 1)
  }
}

function startOnboarding() {
  started.value = true
  errorMessage.value = ''
}

function goBack() {
  if (currentIndex.value === 0) {
    started.value = false
    return
  }

  currentIndex.value -= 1
  errorMessage.value = ''
}

function goNext() {
  if (isLastQuestion.value) {
    submitOnboarding()
    return
  }

  currentIndex.value += 1
  errorMessage.value = ''
}

function skipQuestion() {
  const key = currentQuestion.value.key
  answers[key] = Array.isArray(answers[key]) ? [] : ''
  if (key === 'primary_crop_name') primaryCropCustom.value = ''
  if (key === 'secondary_crop_names') secondaryCropCustom.value = ''
  if (key === 'received_policy_names') {
    receivedPolicySearch.value = ''
    receivedPolicyCustom.value = ''
  }

  if (['young_farmer_eligible', 'registered_farm_business', 'self_contribution_available'].includes(key)) {
    answers[key] = null
  }

  goNext()
}

function openRegionPicker(key) {
  activeRegionKey.value = key
  showRegionModal.value = true
}

function closeRegionPicker() {
  showRegionModal.value = false
  activeRegionKey.value = ''
}

function selectRegion(region) {
  if (activeRegionKey.value) {
    answers[activeRegionKey.value] = region
  }

  closeRegionPicker()
}

function splitTextList(value) {
  return String(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildPayload() {
  const payload = {}
  const primaryCrop = primaryCropCustom.value.trim() || answers.primary_crop_name
  const secondaryCrops = [...answers.secondary_crop_names]
  const secondaryCustomCrop = secondaryCropCustom.value.trim()
  const receivedPolicies = [...answers.received_policy_names]
  const receivedPolicyCustomName = receivedPolicyCustom.value.trim()

  if (primaryCrop) answers.primary_crop_name = primaryCrop
  if (secondaryCustomCrop && !secondaryCrops.includes(secondaryCustomCrop)) secondaryCrops.push(secondaryCustomCrop)
  if (receivedPolicyCustomName && !receivedPolicies.includes(receivedPolicyCustomName)) {
    receivedPolicies.push(receivedPolicyCustomName)
  }

  Object.entries(answers).forEach(([key, value]) => {
    const nextValue = key === 'secondary_crop_names' ? secondaryCrops : key === 'received_policy_names' ? receivedPolicies : value

    if (Array.isArray(nextValue)) {
      if (nextValue.length) payload[key] = nextValue
      return
    }

    if (nextValue === null || nextValue === '') {
      return
    }

    if (['age', 'farming_start_year', 'cultivation_area'].includes(key)) {
      const numericValue = Number(nextValue)
      if (Number.isFinite(numericValue)) payload[key] = numericValue
      return
    }

    if (['secondary_crop_names', 'received_policy_names'].includes(key)) {
      const list = splitTextList(nextValue)
      if (list.length) payload[key] = list
      return
    }

    payload[key] = nextValue
  })

  return payload
}

function finishLocally(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  const location = payload.farmland_region || payload.residence_region

  if (location) {
    setFarmLocation(location)
  }

  router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/support-programs')
}

async function submitOnboarding() {
  isSaving.value = true
  errorMessage.value = ''

  const payload = buildPayload()
  const location = payload.farmland_region || payload.residence_region

  try {
    const result = await savePolicyOnboarding(payload, accessToken.value)
    savedEndpoint.value = result.endpoint
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    console.warn('정책 온보딩 저장 실패:', error)
  }

  try {
    await syncPolicyOnboardingToUserProfile(payload, accessToken.value)
  } catch (error) {
    console.warn('정책 온보딩 농장 프로필 반영 실패:', error)
  }

  if (location) {
    setFarmLocation(location)
  }

  try {
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/support-programs')
  } finally {
    isSaving.value = false
  }
}

async function loadPolicyOptions() {
  if (!accessToken.value) return

  isLoadingPolicies.value = true

  try {
    const result = await fetchPolicyPrograms(accessToken.value)
    policyOptions.value = result.programs.map((program) => program.name).filter(Boolean)
  } catch (error) {
    policyOptions.value = []
    console.warn('받은 지원사업 검색 목록을 불러오지 못했습니다.', error)
  } finally {
    isLoadingPolicies.value = false
  }
}

loadPolicyOptions()
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>

    <main class="min-h-screen flex items-center justify-center px-5 py-10">
      <section class="w-full max-w-[520px]">
        <div v-if="!started" class="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
          <div class="text-xs font-semibold text-brand mb-3">맞춤 정책 추천 준비</div>
          <h1 class="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
            몇 가지 정보만 알려주시면<br />지원사업을 더 정확히 찾아드릴게요.
          </h1>
          <p class="mt-4 text-sm text-gray-600 leading-relaxed">
            지역, 작물, 재배 규모, 신청 조건을 바탕으로 정책의 상세 추천 정확도를 높입니다.
            모르는 항목은 언제든 건너뛸 수 있어요.
          </p>

          <div class="mt-6 rounded-xl bg-brand-light border border-brand-border p-4">
            <div class="text-sm font-semibold text-gray-900">총 {{ questions.length }}개의 질문</div>
            <div class="text-xs text-gray-600 mt-1">답변은 추천 필터링에만 사용되고, 나중에 다시 수정할 수 있습니다.</div>
          </div>

          <div class="mt-7 flex gap-3">
            <button
              class="flex-1 py-3.5 bg-brand text-white rounded-lg text-sm font-bold"
              @click="startOnboarding"
            >
              시작하기
            </button>
            <button
              class="px-4 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
              @click="finishLocally({})"
            >
              나중에
            </button>
          </div>
        </div>

        <div v-else class="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
          <div class="mb-7">
            <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>{{ currentIndex + 1 }} / {{ questions.length }}</span>
              <span>{{ remainingCount }}개 남았어요</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-brand transition-all" :style="{ width: `${progressPercent}%` }"></div>
            </div>
          </div>

          <transition name="fade" mode="out-in">
            <div :key="currentQuestion.key">
              <div class="text-xs font-semibold text-brand mb-3">정책 추천 조건</div>
              <h2 class="text-[24px] font-bold text-gray-900 tracking-tight leading-tight">
                {{ currentQuestion.title }}
              </h2>
              <p class="mt-3 text-sm text-gray-600 leading-relaxed">{{ currentQuestion.description }}</p>
              <div
                v-if="currentQuestion.helper"
                class="mt-4 rounded-xl bg-brand-light border border-brand-border p-4 text-sm text-gray-700 leading-relaxed"
              >
                {{ currentQuestion.helper }}
              </div>

              <div class="mt-7">
                <div v-if="currentQuestion.type === 'number'" class="flex items-center gap-2">
                  <input
                    v-model="answers[currentQuestion.key]"
                    type="number"
                    inputmode="numeric"
                    :placeholder="currentQuestion.placeholder"
                    class="flex-1 px-4 py-4 border border-gray-300 rounded-xl text-lg outline-none focus:border-brand"
                  />
                  <span class="text-sm text-gray-500">{{ currentQuestion.suffix }}</span>
                </div>

                <input
                  v-else-if="currentQuestion.type === 'text'"
                  v-model.trim="answers[currentQuestion.key]"
                  type="text"
                  :placeholder="currentQuestion.placeholder"
                  class="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg outline-none focus:border-brand"
                />

                <button
                  v-else-if="currentQuestion.type === 'region'"
                  type="button"
                  class="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg text-left outline-none hover:border-brand focus:border-brand bg-white transition-colors"
                  :class="answers[currentQuestion.key] ? 'text-gray-900' : 'text-gray-400'"
                  @click="openRegionPicker(currentQuestion.key)"
                >
                  {{ answers[currentQuestion.key] || currentQuestion.placeholder }}
                </button>

                <div v-else-if="currentQuestion.type === 'crop-single'" class="space-y-4">
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="crop in currentQuestion.options"
                      :key="crop"
                      class="px-4 py-3.5 rounded-xl border text-sm font-semibold"
                      :class="answers.primary_crop_name === crop && !primaryCropCustom ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700'"
                      @click="answers.primary_crop_name = crop; primaryCropCustom = ''"
                    >
                      {{ crop }}
                    </button>
                  </div>
                  <input
                    v-model.trim="primaryCropCustom"
                    type="text"
                    :placeholder="currentQuestion.placeholder"
                    class="w-full px-4 py-3.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-brand"
                    @input="answers.primary_crop_name = ''"
                  />
                </div>

                <div v-else-if="currentQuestion.type === 'crop-multi'" class="space-y-4">
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="crop in currentQuestion.options"
                      :key="crop"
                      class="px-4 py-3.5 rounded-xl border text-sm font-semibold"
                      :class="answers.secondary_crop_names.includes(crop) ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700'"
                      @click="toggleMulti(currentQuestion.key, crop)"
                    >
                      {{ crop }}
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <input
                      v-model.trim="secondaryCropCustom"
                      type="text"
                      :placeholder="currentQuestion.placeholder"
                      class="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-brand"
                      @keydown.enter.prevent="addSecondaryCustomCrop"
                    />
                    <button class="px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold" @click="addSecondaryCustomCrop">
                      추가
                    </button>
                  </div>
                  <div v-if="answers.secondary_crop_names.length" class="flex flex-wrap gap-2">
                    <button
                      v-for="crop in answers.secondary_crop_names"
                      :key="crop"
                      class="px-3 py-1.5 bg-brand-light text-brand rounded-full text-xs font-semibold"
                      @click="removeListValue('secondary_crop_names', crop)"
                    >
                      {{ crop }} ×
                    </button>
                  </div>
                </div>

                <div v-else-if="currentQuestion.type === 'boolean'" class="grid grid-cols-2 gap-3">
                  <button
                    class="py-4 rounded-xl border text-sm font-semibold"
                    :class="answers[currentQuestion.key] === true ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700'"
                    @click="answers[currentQuestion.key] = true"
                  >
                    네
                  </button>
                  <button
                    class="py-4 rounded-xl border text-sm font-semibold"
                    :class="answers[currentQuestion.key] === false ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700'"
                    @click="answers[currentQuestion.key] = false"
                  >
                    아니요
                  </button>
                </div>

                <div v-else-if="currentQuestion.type === 'single'" class="grid grid-cols-1 gap-2">
                  <button
                    v-for="option in currentQuestion.options"
                    :key="optionValue(option)"
                    class="group relative text-left px-4 py-3.5 rounded-xl border text-sm font-semibold"
                    :class="answers[currentQuestion.key] === optionValue(option) ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700'"
                    :title="optionDescription(option)"
                    @click="answers[currentQuestion.key] = optionValue(option)"
                  >
                    {{ optionValue(option) }}
                    <span
                      v-if="optionDescription(option)"
                      class="pointer-events-none absolute left-4 right-4 top-full z-10 mt-2 hidden rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg group-hover:block"
                    >
                      {{ optionDescription(option) }}
                    </span>
                  </button>
                </div>

                <div v-else-if="currentQuestion.type === 'policy-search'" class="space-y-4">
                  <input
                    v-model.trim="receivedPolicySearch"
                    type="text"
                    :placeholder="currentQuestion.placeholder"
                    class="w-full px-4 py-4 border border-gray-300 rounded-xl text-lg outline-none focus:border-brand"
                  />
                  <div v-if="isLoadingPolicies" class="text-sm text-gray-500">지원사업 목록을 확인하는 중입니다...</div>
                  <div v-else-if="filteredPolicyOptions.length" class="grid grid-cols-1 gap-2">
                    <button
                      v-for="policyName in filteredPolicyOptions"
                      :key="policyName"
                      class="text-left px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
                      @click="addReceivedPolicy(policyName)"
                    >
                      {{ policyName }}
                    </button>
                  </div>
                  <div v-else class="text-sm text-gray-500">검색 결과가 없으면 직접 입력해도 됩니다.</div>

                  <div class="flex gap-2">
                    <input
                      v-model.trim="receivedPolicyCustom"
                      type="text"
                      placeholder="직접 입력"
                      class="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-brand"
                      @keydown.enter.prevent="addReceivedPolicy(receivedPolicyCustom)"
                    />
                    <button class="px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold" @click="addReceivedPolicy(receivedPolicyCustom)">
                      추가
                    </button>
                  </div>

                  <div v-if="answers.received_policy_names.length" class="flex flex-wrap gap-2">
                    <button
                      v-for="policyName in answers.received_policy_names"
                      :key="policyName"
                      class="px-3 py-1.5 bg-brand-light text-brand rounded-full text-xs font-semibold"
                      @click="removeListValue('received_policy_names', policyName)"
                    >
                      {{ policyName }} ×
                    </button>
                  </div>
                </div>

                <div v-else class="grid grid-cols-2 gap-2">
                  <button
                    v-for="option in currentQuestion.options"
                    :key="option"
                    class="px-4 py-3.5 rounded-xl border text-sm font-semibold"
                    :class="answers[currentQuestion.key].includes(option) ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700'"
                    @click="toggleMulti(currentQuestion.key, option)"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
            </div>
          </transition>

          <p v-if="errorMessage" class="mt-5 text-sm text-red-600">{{ errorMessage }}</p>
          <button
            v-if="errorMessage"
            class="mt-3 text-sm text-gray-600 underline"
            @click="finishLocally(buildPayload())"
          >
            임시 저장하고 지원사업 보기
          </button>

          <div class="mt-8 flex gap-3">
            <button
              class="px-4 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
              @click="goBack"
            >
              이전
            </button>
            <button
              class="px-4 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
              @click="skipQuestion"
            >
              건너뛰기
            </button>
            <button
              class="flex-1 py-3.5 bg-brand text-white rounded-lg text-sm font-bold disabled:opacity-60"
              :disabled="isSaving"
              @click="goNext"
            >
              {{ isSaving ? '저장 중...' : isLastQuestion ? '추천 준비 완료' : '다음' }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <RegionPickerModal
      v-if="showRegionModal"
      @close="closeRegionPicker"
      @select="selectRegion"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(14px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}
</style>
