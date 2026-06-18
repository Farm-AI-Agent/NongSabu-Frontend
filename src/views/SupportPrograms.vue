<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import AppFooter from '../components/AppFooter.vue'
import { useAuth } from '../composables/useAuth'
import { ApiError } from '../lib/api'
import { fetchPolicyPrograms } from '../lib/policyApi'

const { accessToken } = useAuth()

const supportPrograms = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const apiEndpoint = ref('')

const searchQuery = ref('')
const selectedCategory = ref('전체')
const selectedCrop = ref('전체')
const sortMode = ref('deadlineAsc')
const selectedProgram = ref(null)
const showModal = ref(false)

const sortOptions = [
  { value: 'deadlineAsc', label: '마감일 빠른순' },
  { value: 'amountDesc', label: '금액 높은순' },
  { value: 'amountAsc', label: '금액 낮은순' },
  { value: 'sourceAsc', label: '출처 가나다순' },
]

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'ko')
}

function isMissingDeadline(program) {
  return !Number.isFinite(program.deadlineValue) || program.deadlineValue === Number.MAX_SAFE_INTEGER
}

function compareDeadlineAsc(a, b) {
  const now = Date.now()
  const aMissing = isMissingDeadline(a)
  const bMissing = isMissingDeadline(b)
  const aPast = !aMissing && a.deadlineValue < now
  const bPast = !bMissing && b.deadlineValue < now

  if (aPast !== bPast) {
    return aPast ? 1 : -1
  }

  if (aMissing !== bMissing) {
    return aMissing ? 1 : -1
  }

  const dateCompare = a.deadlineValue - b.deadlineValue
  if (dateCompare !== 0) {
    return dateCompare
  }

  return compareText(a.name, b.name)
}

function compareAmount(a, b, direction) {
  const amountCompare = direction === 'desc'
    ? b.amountValue - a.amountValue
    : a.amountValue - b.amountValue

  if (amountCompare !== 0) {
    return amountCompare
  }

  return compareDeadlineAsc(a, b)
}

const categories = computed(() => [
  '전체',
  ...[...new Set(supportPrograms.value.map((program) => program.category).filter(Boolean))].sort(compareText),
])

const crops = computed(() => [
  '전체',
  ...[...new Set(supportPrograms.value.map((program) => program.crop).filter(Boolean))].sort(compareText),
])

const filteredPrograms = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  const filtered = supportPrograms.value.filter((program) => {
    const haystack = [program.name, program.description, program.sourceSite, program.category, program.crop]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchSearch = !keyword || haystack.includes(keyword)
    const matchCategory = selectedCategory.value === '전체' || program.category === selectedCategory.value
    const matchCrop = selectedCrop.value === '전체' || program.crop === selectedCrop.value

    return matchSearch && matchCategory && matchCrop
  })

  return [...filtered].sort((a, b) => {
    switch (sortMode.value) {
      case 'amountDesc':
        return compareAmount(a, b, 'desc')
      case 'amountAsc':
        return compareAmount(a, b, 'asc')
      case 'sourceAsc':
        return compareText(a.sourceSite, b.sourceSite) || compareDeadlineAsc(a, b)
      case 'deadlineAsc':
      default:
        return compareDeadlineAsc(a, b)
    }
  })
})

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem('fd_fav_programs') || '[]')
  } catch (e) {
    return []
  }
}

function saveFavorites(list) {
  localStorage.setItem('fd_fav_programs', JSON.stringify(list))
}

function applyFavorites(programs) {
  const savedFavs = loadFavorites()
  return programs.map((program) => ({
    ...program,
    liked: savedFavs.some((favorite) => favorite.id === program.id),
  }))
}

function resolveErrorMessage(error) {
  return error instanceof ApiError ? error.message : '지원사업 정보를 불러오지 못했습니다.'
}

async function loadPolicyPrograms() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await fetchPolicyPrograms(accessToken.value)
    apiEndpoint.value = result.endpoint
    supportPrograms.value = applyFavorites(result.programs)
  } catch (error) {
    supportPrograms.value = []
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function toggleLike(program) {
  program.liked = !program.liked
  let favs = loadFavorites()
  if (program.liked) {
    // add full program object (avoid duplicates)
    if (!favs.some(f => f.id === program.id)) favs.push(program)
  } else {
    favs = favs.filter(f => f.id !== program.id)
  }
  saveFavorites(favs)
}

function openDetail(program) {
  selectedProgram.value = program
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedProgram.value = null
}

onMounted(() => {
  loadPolicyPrograms()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <Sidebar />

    <div class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col">
      <!-- Header -->
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">지원사업 정보</div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="text-[26px] font-bold text-gray-900 tracking-tight">맞춤형 정부 지원사업</div>
          <router-link
            to="/policy-onboarding"
            class="inline-flex items-center justify-center px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium no-underline"
          >
            추천 조건 입력
          </router-link>
        </div>
        <div v-if="apiEndpoint" class="text-xs text-gray-400 mt-2">
          연결된 정책 API: {{ apiEndpoint }}
        </div>
      </div>

      <div class="mb-5 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="지원사업명이나 설명으로 검색..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <select
          v-model="sortMode"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Filters -->
      <div class="mb-6 flex gap-3 overflow-x-auto pb-2">
        <!-- Category filter -->
        <div class="flex gap-2 min-w-fit">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectedCategory = cat"
            class="px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
            :class="
              selectedCategory === cat
                ? 'bg-brand text-white font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Crop filter -->
      <div class="mb-6 flex gap-3 overflow-x-auto pb-2">
        <div class="flex gap-2 min-w-fit">
          <button
            v-for="crop in crops"
            :key="crop"
            @click="selectedCrop = crop"
            class="px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
            :class="
              selectedCrop === crop
                ? 'bg-brand text-white font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
          >
            {{ crop }}
          </button>
        </div>
      </div>

      <!-- Programs list -->
      <div class="space-y-4 mb-8">
        <div v-if="isLoading" class="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">
          정책 지원사업을 불러오는 중입니다...
        </div>

        <div v-else-if="errorMessage" class="bg-rose-50 border border-rose-100 rounded-xl p-5">
          <div class="text-sm font-semibold text-rose-700">정책 API 연결을 확인해주세요.</div>
          <div class="text-sm text-rose-600 mt-1">{{ errorMessage }}</div>
          <button
            class="mt-4 px-4 py-2 bg-white border border-rose-200 text-rose-700 rounded-lg text-sm font-medium"
            @click="loadPolicyPrograms"
          >
            다시 불러오기
          </button>
        </div>

        <div v-else-if="filteredPrograms.length === 0" class="text-center py-12">
          <div class="text-gray-400 text-sm">검색 결과가 없습니다.</div>
        </div>

        <template v-else>
          <div
            v-for="program in filteredPrograms"
            :key="program.id"
            class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0" @click="openDetail(program)">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[11px] font-medium px-2.5 py-1 bg-brand-light text-brand rounded-full">
                    {{ program.category }}
                  </span>
                  <span class="text-[11px] font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {{ program.crop }}
                  </span>
                  <span class="text-[11px] font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {{ program.sourceSite }}
                  </span>
                </div>
                <div class="text-[15px] font-bold text-gray-900 mb-1 truncate">
                  {{ program.name }}
                </div>
                <div class="text-sm text-gray-600 mb-3 line-clamp-2">
                  {{ program.description }}
                </div>
                <div class="flex gap-4 text-sm">
                  <div class="text-brand font-bold">{{ program.subsidy }}</div>
                  <div class="text-gray-500">마감: {{ program.deadline }}</div>
                </div>
              </div>
              <button
                @click.stop="toggleLike(program)"
                class="flex-shrink-0 text-2xl transition-transform"
                :class="program.liked ? 'text-red-500' : 'text-gray-300 hover:text-gray-400'"
              >
                {{ program.liked ? '❤️' : '🤍' }}
              </button>
            </div>
          </div>
        </template>
      </div>

      <AppFooter />
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showModal && selectedProgram"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
      @click.self="closeModal"
    >
      <div class="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
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
          <!-- Title -->
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
                  <span class="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {{ selectedProgram.sourceSite }}
                  </span>
                </div>
              </div>
              <button
                @click="toggleLike(selectedProgram)"
                class="flex-shrink-0 text-3xl"
                :class="selectedProgram.liked ? 'text-red-500' : 'text-gray-300'"
              >
                {{ selectedProgram.liked ? '❤️' : '🤍' }}
              </button>
            </div>
          </div>

          <!-- Key info -->
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
              <div>
                <div class="text-xs text-gray-600 mb-1">불러온 출처</div>
                <div class="text-lg font-bold text-brand">{{ selectedProgram.sourceSite }}</div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-6">
            <div class="text-[15px] font-bold text-gray-900 mb-2">사업 소개</div>
            <div class="text-sm text-gray-600 leading-relaxed">
              {{ selectedProgram.description }}
            </div>
          </div>

          <!-- Requirements -->
          <div class="mb-6">
            <div class="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div class="w-1 h-4 bg-brand rounded-sm"></div>
              신청 자격
            </div>
            <ul v-if="selectedProgram.requirements.length" class="space-y-2">
              <li v-for="(req, i) in selectedProgram.requirements" :key="i" class="flex gap-2 text-sm text-gray-600">
                <span class="flex-shrink-0 text-brand">•</span>
                <span>{{ req }}</span>
              </li>
            </ul>
            <div v-else class="text-sm text-gray-500">신청 자격 정보가 아직 제공되지 않았습니다.</div>
          </div>

          <!-- Benefits -->
          <div class="mb-6">
            <div class="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div class="w-1 h-4 bg-brand rounded-sm"></div>
              지원 내용
            </div>
            <ul v-if="selectedProgram.benefits.length" class="space-y-2">
              <li v-for="(benefit, i) in selectedProgram.benefits" :key="i" class="flex gap-2 text-sm text-gray-600">
                <span class="flex-shrink-0 text-brand">•</span>
                <span>{{ benefit }}</span>
              </li>
            </ul>
            <div v-else class="text-sm text-gray-500">지원 내용 상세가 아직 제공되지 않았습니다.</div>
          </div>

          <!-- Contact -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div class="text-sm text-gray-600 mb-1">문의처</div>
            <div class="text-sm font-medium text-gray-900">{{ selectedProgram.contact }}</div>
          </div>

          <!-- Action button -->
          <a
            v-if="selectedProgram.applicationUrl"
            :href="selectedProgram.applicationUrl"
            target="_blank"
            rel="noreferrer"
            class="block text-center w-full py-3.5 bg-brand text-white rounded-lg text-sm font-bold mb-3 hover:bg-opacity-90 transition-colors no-underline"
          >
            신청하기
          </a>
          <button
            @click="closeModal"
            class="w-full py-3.5 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>

    <FloatingChatButton />
  </div>
</template>
