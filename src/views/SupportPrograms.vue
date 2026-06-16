<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import NavTabs from '../components/NavTabs.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import { useAuth } from '../composables/useAuth'

const { userName } = useAuth()

// 더미 데이터
const supportPrograms = ref([
  {
    id: 1,
    name: '스마트팜 기술 지원사업',
    category: '시설·기계',
    crop: '토마토',
    subsidy: '5,000만원',
    deadline: '2025년 6월 30일',
    description: '스마트팜 도입을 위한 시설 및 기술 지원',
    requirements: [
      '농업경영체 등록 필수',
      '최근 3년 이상 영농 경력',
      '경영 규모 500㎡ 이상'
    ],
    benefits: [
      '센서 및 제어 시스템 지원',
      '설치 비용 90% 지원',
      '3년간 기술 지원'
    ],
    contact: '도농업기술원 스마트팜팀',
    liked: false
  },
  {
    id: 2,
    name: '친환경 농산물 인증 지원',
    category: '인증',
    crop: '딸기',
    subsidy: '200만원',
    deadline: '2025년 7월 15일',
    description: '친환경 농산물 인증 취득을 위한 비용 지원',
    requirements: [
      '영농 경력 1년 이상',
      '친환경 인증 신청 완료'
    ],
    benefits: [
      '인증 검사료 50% 지원',
      '컨설팅 무료 제공'
    ],
    contact: '시 농산물품질관리사',
    liked: false
  },
  {
    id: 3,
    name: '병해충 방제 장비 구입비',
    category: '기계',
    crop: '오이',
    subsidy: '800만원',
    deadline: '2025년 8월 31일',
    description: '병해충 방제 전문 장비 구입 지원사업',
    requirements: [
      '영농 경력 2년 이상',
      '재배 규모 200㎡ 이상'
    ],
    benefits: [
      '방제 장비 구입비 80% 지원',
      '기술 교육 무료 제공'
    ],
    contact: '도농업기술원',
    liked: false
  },
  {
    id: 4,
    name: '농촌 진흥청 신품종 시범사업',
    category: '교육·연구',
    crop: '토마토',
    subsidy: '3,000만원',
    deadline: '2025년 6월 15일',
    description: '신품종 채소 도입 및 재배 기술 교육',
    requirements: [
      '영농 경력 3년 이상',
      '시범 사업 참여 의사'
    ],
    benefits: [
      '종자 및 기술료 전액 지원',
      '정기적인 기술 지원',
      '판로 연결 지원'
    ],
    contact: '도농업기술원 채소연구팀',
    liked: false
  },
  {
    id: 5,
    name: '농업용수 절감 시설 지원',
    category: '시설·기계',
    crop: '딸기',
    subsidy: '4,000만원',
    deadline: '2025년 7월 31일',
    description: '점적 관개 등 절수 시설 설치 지원',
    requirements: [
      '시설 규모 300㎡ 이상',
      '영농 경력 1년 이상'
    ],
    benefits: [
      '설치 비용 85% 지원',
      '수도료 절감 효과 (연 30% 이상)',
      '유지관리 기술 지원'
    ],
    contact: '도 농정국',
    liked: false
  }
])

const searchQuery = ref('')
const selectedCategory = ref('전체')
const selectedCrop = ref('전체')
const selectedProgram = ref(null)
const showModal = ref(false)

const categories = ['전체', '시설·기계', '인증', '교육·연구']
const crops = ['전체', '토마토', '딸기', '오이']

const filteredPrograms = computed(() => {
  return supportPrograms.value.filter(program => {
    const matchSearch = program.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       program.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = selectedCategory.value === '전체' || program.category === selectedCategory.value
    const matchCrop = selectedCrop.value === '전체' || program.crop === selectedCrop.value
    return matchSearch && matchCategory && matchCrop
  })
})

function toggleLike(program) {
  program.liked = !program.liked
}

function openDetail(program) {
  selectedProgram.value = program
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedProgram.value = null
}
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <NavTabs active="지원사업" />

    <div class="px-5 py-7 max-w-shell mx-auto">
      <!-- Header -->
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">지원사업 정보</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">맞춤형 정부 지원사업</div>
      </div>

      <!-- Search bar -->
      <div class="mb-5">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="지원사업명이나 설명으로 검색..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
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
        <div v-if="filteredPrograms.length === 0" class="text-center py-12">
          <div class="text-gray-400 text-sm">검색 결과가 없습니다.</div>
        </div>

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
      </div>
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
            <ul class="space-y-2">
              <li v-for="(req, i) in selectedProgram.requirements" :key="i" class="flex gap-2 text-sm text-gray-600">
                <span class="flex-shrink-0 text-brand">•</span>
                <span>{{ req }}</span>
              </li>
            </ul>
          </div>

          <!-- Benefits -->
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

          <!-- Contact -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div class="text-sm text-gray-600 mb-1">문의처</div>
            <div class="text-sm font-medium text-gray-900">{{ selectedProgram.contact }}</div>
          </div>

          <!-- Action button -->
          <button class="w-full py-3.5 bg-brand text-white rounded-lg text-sm font-bold mb-3 hover:bg-opacity-90 transition-colors">
            신청하기
          </button>
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
