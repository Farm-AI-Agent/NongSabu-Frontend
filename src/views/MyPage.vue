<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { userName, logout } = useAuth()

// 프로필 편집 모드 상태
const isEditMode = ref(false)

// 사용자 프로필 정보
const userProfile = ref({
  name: '',
  email: '',
  location: '',
  farmName: '',
  selectedCrops: [],
  farmSizeNumber: '',
  joinDate: '2025년 3월 12일'
})

// 작물 목록
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

// 지역 선택 데이터
const provinces = ['서울', '인천', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '부산', '대구', '대전', '광주', '울산', '세종', '제주']
const cities = {
  '서울': ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'],
  '인천': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  '경기': ['수원', '용인', '성남', '안양', '고양', '부천', '화성', '평택', '안산', '시흥', '광명', '군포', '의왕', '하남', '오산', '이천', '안성', '김포', '파주', '양주', '의정부', '포천', '동두천', '구리', '남양주', '광주', '여주'],
  '강원': ['춘천', '강릉', '원주', '동해', '태백', '속초', '삼척', '홍천', '횡성', '평창', '정선'],
  '충북': ['청주', '충주', '제천', '음성', '진천', '옥천', '영동', '괴산', '증평'],
  '충남': ['천안', '아산', '서산', '당진', '공주', '보령', '논산', '계룡', '홍성', '예산', '부여', '서천', '태안', '금산'],
  '전북': ['전주', '군산', '익산', '정읍', '김제', '남원', '완주', '고창', '부안', '순창', '임실', '진안', '무주', '장수'],
  '전남': ['목포', '여수', '순천', '광양', '나주', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'],
  '경북': ['포항', '구미', '경주', '안동', '김천', '영주', '영천', '상주', '문경', '경산', '의성', '청송', '영덕', '울진', '예천'],
  '경남': ['창원', '진주', '통영', '김해', '양산', '거제', '사천', '밀양', '함안', '창녕', '고성', '남해', '하동', '산청', '함양', '거창'],
  '부산': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  '대구': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
  '대전': ['동구', '중구', '서구', '유성구', '대덕구'],
  '광주': ['동구', '서구', '남구', '북구', '광산구'],
  '울산': ['중구', '남구', '동구', '북구', '울주군'],
  '세종': ['세종시'],
  '제주': ['제주시', '서귀포시']
}

const selectedProvince = ref('')
const selectedCity = ref('')

const farmInfo = computed(() => [
  { label: '농장명', value: userProfile.value.farmName },
  { label: '재배 작물', value: formatCrops() },
  { label: '농장 규모', value: formatFarmSize() },
  { label: '가입일', value: userProfile.value.joinDate },
])

const menuItems = ['알림 설정', '진단 이력', '관심 지원사업', '고객센터 · 문의', '이용약관 및 정책']

// 작물 이름 포맷팅
function formatCrops() {
  if (userProfile.value.selectedCrops.length === 0) return '미설정'
  return userProfile.value.selectedCrops
    .map(id => crops.find(c => c.id === id)?.name)
    .join(' · ')
}

// 농장 규모 포맷팅 (숫자 -> "시설 660㎡ (200평)" 형식)
function formatFarmSize() {
  if (!userProfile.value.farmSizeNumber) return '미설정'
  const sqm = parseInt(userProfile.value.farmSizeNumber)
  const pyeong = Math.round(sqm / 3.3)
  return `시설 ${sqm}㎡ (${pyeong}평)`
}

// 프로필 편집 모드 시작
function startEdit() {
  isEditMode.value = true
  const [province, city] = userProfile.value.location.split(' ')
  selectedProvince.value = province
  selectedCity.value = city
}

// 프로필 편집 취소
function cancelEdit() {
  isEditMode.value = false
  loadProfile()
}

// localStorage에서 프로필 로드
function loadProfile() {
  const saved = localStorage.getItem('fd_profile')
  if (saved) {
    try {
      userProfile.value = JSON.parse(saved)
    } catch (e) {
      console.error('프로필 로드 실패:', e)
      setDefaultProfile()
    }
  } else {
    setDefaultProfile()
  }
}

// 기본 프로필 설정
function setDefaultProfile() {
  const location = localStorage.getItem('fd_location') || '전북 김제'
  userProfile.value = {
    name: userName.value,
    email: 'farmer.jung@example.com',
    location: location,
    farmName: '혜영 농원',
    selectedCrops: [12, 7, 5],
    farmSizeNumber: '660',
    joinDate: '2025년 3월 12일'
  }
}

// 프로필 저장
function saveProfile() {
  userProfile.value.location = `${selectedProvince.value} ${selectedCity.value}`
  localStorage.setItem('fd_profile', JSON.stringify(userProfile.value))
  localStorage.setItem('fd_location', userProfile.value.location)
  isEditMode.value = false
}

// 작물 선택 토글
function toggleCrop(cropId) {
  const idx = userProfile.value.selectedCrops.indexOf(cropId)
  if (idx > -1) {
    userProfile.value.selectedCrops.splice(idx, 1)
  } else {
    userProfile.value.selectedCrops.push(cropId)
  }
}

function onLogout() {
  logout()
  router.push('/')
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />

    <div class="px-5 py-7 max-w-shell mx-auto" style="max-width: 760px">
      <!-- 프로필 보기 모드 -->
      <template v-if="!isEditMode">
        <div class="mb-6">
          <div class="text-[26px] font-bold text-gray-900 tracking-tight">마이페이지</div>
        </div>

        <!-- Profile -->
        <div
          class="bg-white border border-gray-200 rounded-xl p-7 mb-5 flex items-center gap-5 flex-wrap"
        >
          <div
            class="w-[72px] h-[72px] bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-bold text-[28px] flex-shrink-0"
          >
            {{ userProfile.name.charAt(0) }}
          </div>
          <div class="flex-1 min-w-[180px]">
            <div class="text-xl font-bold text-gray-900 mb-1">{{ userProfile.name }} 님</div>
            <div class="text-[13px] text-gray-400">{{ userProfile.email }} · 📍 {{ userProfile.location }}</div>
          </div>
          <button
            @click="startEdit"
            class="px-[1.1rem] py-2.5 bg-white border border-gray-300 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            프로필 수정
          </button>
        </div>

        <!-- Farm info -->
        <div class="bg-white border border-gray-200 rounded-xl p-[1.25rem_1.5rem] mb-5">
          <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center gap-2">
            <div class="w-1 h-4 bg-brand rounded-sm"></div>
            내 농장 정보
          </div>
          <div
            v-for="(row, i) in farmInfo"
            :key="row.label"
            class="flex justify-between py-3"
            :class="i > 0 ? 'border-t border-gray-100' : ''"
          >
            <div class="text-sm text-gray-500">{{ row.label }}</div>
            <div class="text-sm text-gray-900 font-medium">{{ row.value }}</div>
          </div>
        </div>
      </template>

      <!-- 프로필 편집 모드 -->
      <template v-else>
        <div class="mb-6">
          <div class="text-[26px] font-bold text-gray-900 tracking-tight">프로필 수정</div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-7 space-y-6">
          <!-- 이름 -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">이름</label>
            <input
              :value="userProfile.name"
              type="text"
              disabled
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          <!-- 이메일 -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">이메일</label>
            <input
              v-model="userProfile.email"
              type="email"
              placeholder="이메일을 입력하세요"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <!-- 지역 선택 -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-3">지역</label>
            <div class="grid grid-cols-3 gap-2 mb-3">
              <button
                v-for="province in provinces"
                :key="province"
                @click="selectedProvince = province; selectedCity = cities[province]?.[0] || ''"
                class="py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
                :class="
                  selectedProvince === province
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
              >
                {{ province }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="city in cities[selectedProvince] || []"
                :key="city"
                @click="selectedCity = city"
                class="py-2.5 px-3 rounded-lg text-sm font-medium transition-colors"
                :class="
                  selectedCity === city
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                "
              >
                {{ city }}
              </button>
            </div>
          </div>

          <!-- 농장명 -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">농장명</label>
            <input
              v-model="userProfile.farmName"
              type="text"
              placeholder="농장명을 입력하세요"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <!-- 재배 작물 -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-3">재배 작물</label>
            <div class="grid grid-cols-5 gap-3 max-h-[280px] overflow-y-auto">
              <button
                v-for="crop in crops"
                :key="crop.id"
                @click="toggleCrop(crop.id)"
                class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors border-2"
                :class="
                  userProfile.selectedCrops.includes(crop.id)
                    ? 'bg-brand bg-opacity-10 border-brand'
                    : 'border-gray-200 hover:border-gray-300'
                "
              >
                <div class="text-3xl">{{ crop.emoji }}</div>
                <div class="text-xs font-medium text-gray-700 text-center leading-tight">{{ crop.name }}</div>
              </button>
            </div>
          </div>

          <!-- 농장 규모 -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">농장 규모 (제곱미터)</label>
            <input
              v-model="userProfile.farmSizeNumber"
              type="number"
              placeholder="660"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div v-if="userProfile.farmSizeNumber" class="text-xs text-gray-600 mt-2">
              {{ formatFarmSize() }}
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="flex gap-3 pt-4">
            <button
              @click="cancelEdit"
              class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              @click="saveProfile"
              class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </template>

      <!-- Settings menu (프로필 보기 모드에서만 표시) -->
      <template v-if="!isEditMode">
        <div class="bg-white border border-gray-200 rounded-xl py-2 mb-5">
          <div
            v-for="(item, i) in menuItems"
            :key="item"
            class="flex justify-between items-center px-6 py-4 cursor-pointer"
            :class="i > 0 ? 'border-t border-gray-100' : ''"
          >
            <div class="text-sm text-gray-900">{{ item }}</div>
            <div class="text-base text-slate-300">›</div>
          </div>
        </div>

        <!-- Logout -->
        <button
          class="w-full py-3.5 bg-white border border-gray-200 rounded-[10px] text-sm text-red-600 font-medium"
          @click="onLogout"
        >
          로그아웃
        </button>
      </template>
    </div>
  </div>
</template>
