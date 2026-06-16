<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { loggedIn, userName } = useAuth()

const location = ref(localStorage.getItem('fd_location') || '전북 김제')
const showLocationModal = ref(false)

const provinces = ['서울', '인천', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '부산', '대구', '대전', '광주', '울산', '세종', '제주']
const cities = {
  '서울': [
    '종로구', '중구', '용산구', '성동구', '광진구',
    '동대문구', '중랑구', '성북구', '강북구', '도봉구',
    '노원구', '은평구', '서대문구', '마포구', '양천구',
    '강서구', '구로구', '금천구', '영등포구', '동작구',
    '관악구', '서초구', '강남구', '송파구', '강동구'
  ],

  '인천': [
    '중구', '동구', '미추홀구', '연수구', '남동구',
    '부평구', '계양구', '서구', '강화군', '옹진군'
  ],

  '경기': [
    '수원', '용인', '성남', '안양',
    '고양', '부천', '화성', '평택',
    '안산', '시흥', '광명', '군포',
    '의왕', '하남', '오산', '이천',
    '안성', '김포', '파주', '양주',
    '의정부', '포천', '동두천', '구리',
    '남양주', '광주', '여주'
  ],

  '강원': [
    '춘천', '강릉', '원주',
    '동해', '태백', '속초', '삼척',
    '홍천', '횡성', '평창', '정선'
  ],

  '충북': [
    '청주', '충주',
    '제천', '음성', '진천',
    '옥천', '영동', '괴산', '증평'
  ],

  '충남': [
    '천안', '아산', '서산', '당진',
    '공주', '보령', '논산', '계룡',
    '홍성', '예산', '부여', '서천',
    '태안', '금산'
  ],

  '전북': [
    '전주', '군산', '익산', '정읍',
    '김제', '남원', '완주', '고창',
    '부안', '순창', '임실', '진안',
    '무주', '장수'
  ],

  '전남': [
    '목포', '여수', '순천', '광양',
    '나주', '담양', '곡성', '구례',
    '고흥', '보성', '화순', '장흥',
    '강진', '해남', '영암', '무안',
    '함평', '영광', '장성', '완도',
    '진도', '신안'
  ],

  '경북': [
    '포항', '구미', '경주', '안동',
    '김천', '영주', '영천', '상주',
    '문경', '경산', '의성', '청송',
    '영덕', '울진', '예천'
  ],

  '경남': [
    '창원', '진주', '통영', '김해',
    '양산', '거제', '사천', '밀양',
    '함안', '창녕', '고성', '남해',
    '하동', '산청', '함양', '거창'
  ],

  '부산': [
    '중구', '서구', '동구', '영도구',
    '부산진구', '동래구', '남구', '북구',
    '해운대구', '사하구', '금정구', '강서구',
    '연제구', '수영구', '사상구', '기장군'
  ],

  '대구': [
    '중구', '동구', '서구', '남구',
    '북구', '수성구', '달서구', '달성군',
    '군위군'
  ],

  '대전': [
    '동구', '중구', '서구', '유성구', '대덕구'
  ],

  '광주': [
    '동구', '서구', '남구', '북구', '광산구'
  ],

  '울산': [
    '중구', '남구', '동구', '북구', '울주군'
  ],

  '세종': [
    '세종시'
  ],

  '제주': [
    '제주시', '서귀포시'
  ]
}

const selectedProvince = ref(location.value.split(' ')[0])
const selectedCity = ref(location.value.split(' ')[1])

function openLocationModal() {
  showLocationModal.value = true
}

function closeLocationModal() {
  showLocationModal.value = false
}

function selectLocation() {
  const newLocation = `${selectedProvince.value} ${selectedCity.value}`
  location.value = newLocation
  localStorage.setItem('fd_location', newLocation)
  closeLocationModal()
}
</script>

<template>
  <header class="bg-white border-b border-gray-200">
    <div
      class="max-w-shell mx-auto px-5 py-3.5 flex justify-between items-center flex-wrap gap-3"
    >
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 no-underline">
        <img src="/농사부.png" alt="농사부 로고" class="w-9 h-9 rounded-md" />
        <div class="font-bold text-brand text-lg tracking-tight">작물닥터 농사부</div>
        <div class="text-xs text-gray-400 ml-1 hidden sm:block">농업 병해충 진단 비서</div>
      </router-link>

      <!-- Right: login state -->
      <div class="flex items-center gap-5">
        <button
          @click="openLocationModal"
          class="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          📍 {{ location }}
        </button>

        <router-link
          v-if="loggedIn"
          to="/mypage"
          class="text-xs text-gray-500 flex items-center gap-1.5 no-underline"
        >
          <div
            class="w-7 h-7 bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-medium text-xs"
          >
            {{ userName.charAt(0) }}
          </div>
          {{ userName }} 님
        </router-link>

        <div v-else class="flex items-center gap-2">
          <router-link
            to="/login"
            class="text-sm text-brand no-underline px-3.5 py-1.5 border border-brand-border rounded-md"
          >
            로그인
          </router-link>
          <router-link
            to="/login"
            class="text-sm text-white no-underline px-3.5 py-1.5 bg-brand rounded-md"
          >
            회원가입
          </router-link>
        </div>
      </div>
    </div>

    <!-- Location Modal -->
    <div
      v-if="showLocationModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeLocationModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm mx-4 max-h-[80vh] flex flex-col">
        <h2 class="text-lg font-bold text-gray-900 mb-5 p-6 pb-3 sticky top-0 bg-white rounded-t-2xl">지역 설정</h2>

        <div class="overflow-y-auto flex-1 px-6">

        <!-- Province selection -->
        <div class="mb-5">
          <label class="text-sm font-medium text-gray-900 block mb-3">도 선택</label>
          <div class="grid grid-cols-3 gap-2">
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
        </div>

        <!-- City selection -->
        <div class="mb-6">
          <label class="text-sm font-medium text-gray-900 block mb-3">시/군 선택</label>
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

        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 p-6 pt-3 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            @click="closeLocationModal"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            @click="selectLocation"
            class="flex-1 py-3 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
