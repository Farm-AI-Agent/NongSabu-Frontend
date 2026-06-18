<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { ApiError, apiRequest } from '../lib/api'
import { fetchPolicyPrograms } from '../lib/policyApi'

const { accessToken } = useAuth()

const programs = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const showModal = ref(false)
const selectedProgram = ref(null)
const userContext = ref({
  region: '',
  cropNames: [],
})

const recommendedPrograms = computed(() =>
  [...programs.value]
    .sort((a, b) => {
      const now = Date.now()
      const aPast = a.deadlineValue !== Number.MAX_SAFE_INTEGER && a.deadlineValue < now
      const bPast = b.deadlineValue !== Number.MAX_SAFE_INTEGER && b.deadlineValue < now

      if (aPast !== bPast) return aPast ? 1 : -1
      if (a.deadlineValue !== b.deadlineValue) return a.deadlineValue - b.deadlineValue
      return b.amountValue - a.amountValue
    })
    .slice(0, 5),
)

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

async function loadUserContext() {
  if (!accessToken.value) {
    return
  }

  try {
    const [farm, farmProfile, userCrops, cropList] = await Promise.all([
      requestOrNull('/api/v1/farms/me', { token: accessToken.value }),
      requestOrNull('/api/v1/farm-profiles/me', { token: accessToken.value }),
      requestOrNull('/api/v1/user-crops/me', { token: accessToken.value }).then((value) => value || []),
      requestOrNull('/api/v1/crops', { token: accessToken.value }).then((value) => value || []),
    ])
    const cropsById = new Map((cropList || []).map((crop) => [crop.id, crop]))

    userContext.value = {
      region: farmProfile?.region || farm?.location || '',
      cropNames: (userCrops || [])
        .map((item) => cropsById.get(item.cropId)?.name || item.cropName)
        .filter(Boolean),
    }
  } catch (error) {
    console.warn('추천 이유에 사용할 사용자 정보를 불러오지 못했습니다.', error)
  }
}

function getBadge(program) {
  if (program.deadlineValue === Number.MAX_SAFE_INTEGER) {
    return {
      label: '상시/확인',
      className: 'bg-[#eef2ff] text-indigo-700',
    }
  }

  if (program.deadlineValue < Date.now()) {
    return {
      label: '마감 확인',
      className: 'bg-[#fef3e2] text-warn',
    }
  }

  return {
    label: '신청 가능',
    className: 'bg-[#e7f3ec] text-success',
  }
}

function getRecommendationReason(program) {
  if (program.recommendationReason) {
    return program.recommendationReason
  }

  if (program.matchedCriteria?.length) {
    return program.matchedCriteria.join(', ')
  }

  const reasons = []
  const regionToken = userContext.value.region.split(' ')[0]

  if (program.crop && program.crop !== '전체' && userContext.value.cropNames.includes(program.crop)) {
    reasons.push(`등록 작물 ${program.crop}`)
  }

  if (regionToken && [program.name, program.description, program.sourceSite].filter(Boolean).some((text) => String(text).includes(regionToken))) {
    reasons.push(`농장 지역 ${userContext.value.region}`)
  }

  if (program.category && program.category !== '정책') {
    reasons.push(`${program.category} 분야`)
  }

  if (!reasons.length) {
    return '온보딩과 농장 프로필을 바탕으로 추천된 사업입니다.'
  }

  return `${reasons.join(' · ')} 기준으로 추천`
}

async function loadPrograms() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await loadUserContext()
    const result = await fetchPolicyPrograms(accessToken.value)
    programs.value = result.programs
  } catch (error) {
    programs.value = []
    errorMessage.value = error?.message || '추천 지원사업을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function openDetail(program) {
  selectedProgram.value = program
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedProgram.value = null
}

onMounted(loadPrograms)
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-[10px] p-[1.25rem_1.5rem] h-full">
    <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center gap-2">
      <div class="w-1 h-4 bg-brand rounded-sm"></div>
      추천 지원사업
    </div>
    <div v-if="isLoading" class="py-8 text-sm text-gray-500">
      추천 지원사업을 불러오는 중입니다...
    </div>
    <div v-else-if="errorMessage" class="rounded-lg border border-rose-100 bg-rose-50 p-4">
      <div class="text-sm text-rose-700">{{ errorMessage }}</div>
      <button
        type="button"
        class="mt-3 px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs font-medium text-rose-700"
        @click="loadPrograms"
      >
        다시 불러오기
      </button>
    </div>
    <div v-else-if="!recommendedPrograms.length" class="py-8 text-sm text-gray-500">
      추천할 지원사업이 아직 없습니다.
    </div>
    <div v-else class="flex flex-col">
      <div
        v-for="(p, i) in recommendedPrograms"
        :key="p.id"
        class="py-3.5 cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
        :class="i > 0 ? 'border-t border-gray-100' : ''"
        @click="openDetail(p)"
      >
        <div class="flex justify-between items-start gap-2 mb-1.5">
          <div class="text-sm font-medium text-gray-900">{{ p.name }}</div>
          <div
            class="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            :class="getBadge(p).className"
          >
            {{ getBadge(p).label }}
          </div>
        </div>

        <div class="flex gap-3 text-xs text-gray-500">
          <div class="text-brand font-bold">{{ p.subsidy }}</div>
          <div>마감: {{ p.deadline }}</div>
        </div>
        <div class="mt-2 text-xs leading-relaxed text-gray-500">
          추천 이유: {{ getRecommendationReason(p) }}
        </div>
      </div>
    </div>
  </div>

  <!-- 9️⃣ 상세정보 모달 -->
  <!-- 왜? SupportPrograms.vue의 모달과 동일하게, 사용자가 선택한 사업의 상세정보를 보여주는 부분 -->
  <div
    v-if="showModal && selectedProgram"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
    @click.self="closeModal"
  >
    <div class="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
      <!-- 🔟 모달 헤더 (제목과 닫기 버튼) -->
      <!-- 왜? 사용자가 모달의 목적을 알 수 있고, 닫기 버튼으로 쉽게 닫을 수 있게 -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900">지원사업 상세정보</h2>
        <button
          @click="closeModal"
          class="text-2xl text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div class="px-5 py-6">
        <!-- 1️⃣1️⃣ 사업 제목과 카테고리 -->
        <!-- 왜? 사용자가 어떤 사업인지 한 눈에 파악하고, 카테고리를 통해 분류를 알 수 있게 -->
        <div class="mb-6">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 class="text-[20px] font-bold text-gray-900 mb-2">
                {{ selectedProgram.name }}
              </h1>
              <div class="flex gap-2">
                <span class="text-xs font-medium px-2.5 py-1 bg-brand-light text-brand rounded-full">
                  {{ selectedProgram.category }}
                </span>
                <span class="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {{ selectedProgram.crop }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 1️⃣2️⃣ 지원금액과 마감일을 강조 박스로 표시 -->
        <!-- 왜? 사용자가 가장 중요한 정보(얼마, 언제까지)를 가장 먼저 보게 -->
        <div class="bg-brand-light border border-brand-border rounded-lg p-4 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-600 mb-1">지원금액</div>
              <div class="text-lg font-bold text-brand">{{ selectedProgram.subsidy }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-600 mb-1">신청 마감일</div>
              <div class="text-lg font-bold text-brand">{{ selectedProgram.deadline }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-6">
          <div class="text-xs font-bold text-emerald-800 mb-2">추천 이유</div>
          <div class="text-sm text-emerald-950 leading-relaxed">
            {{ getRecommendationReason(selectedProgram) }}
          </div>
        </div>

        <!-- 1️⃣3️⃣ 사업 설명 -->
        <!-- 왜? 사용자가 사업의 전체적인 목적과 내용을 이해하게 -->
        <div class="mb-6">
          <div class="text-[15px] font-bold text-gray-900 mb-2">사업 소개</div>
          <div class="text-sm text-gray-600 leading-relaxed">
            {{ selectedProgram.description }}
          </div>
        </div>

        <!-- 1️⃣4️⃣ 신청 자격 -->
        <!-- 왜? 사용자가 자신이 이 사업에 신청 가능한지 확인하게 -->
        <div class="mb-6">
          <div class="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div class="w-1 h-4 bg-brand rounded-sm"></div>
            신청 자격
          </div>
          <ul class="space-y-2">
            <li v-for="(req, i) in selectedProgram.requirements" :key="i" class="flex gap-2 text-sm text-gray-600">
              <span class="flex-shrink-0 text-brand">•</span>
              <span>{{ req }}</span>
            </li>
          </ul>
        </div>

        <!-- 1️⃣5️⃣ 지원 내용 -->
        <!-- 왜? 사용자가 구체적으로 무엇을 지원받을 수 있는지 알게 -->
        <div class="mb-6">
          <div class="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div class="w-1 h-4 bg-brand rounded-sm"></div>
            지원 내용
          </div>
          <ul class="space-y-2">
            <li v-for="(benefit, i) in selectedProgram.benefits" :key="i" class="flex gap-2 text-sm text-gray-600">
              <span class="flex-shrink-0 text-brand">•</span>
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </div>

        <!-- 1️⃣6️⃣ 문의처 -->
        <!-- 왜? 사용자가 추가로 문의해야 할 때 연락처를 알 수 있게 -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div class="text-sm text-gray-600 mb-1">문의처</div>
          <div class="text-sm font-medium text-gray-900">{{ selectedProgram.contact }}</div>
        </div>

        <!-- 1️⃣7️⃣ 닫기 버튼 -->
        <!-- 왜? 사용자가 모달을 닫을 수 있게 (배경 클릭 외에 버튼으로도 닫을 수 있게) -->
        <button
          @click="closeModal"
          class="w-full py-3.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
</template>
