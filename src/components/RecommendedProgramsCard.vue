<script setup>
import { ref } from 'vue'

// 1️⃣ 대시보드에 표시할 추천 지원사업 데이터
// 왜? SupportPrograms.vue와 동일한 구조의 데이터를 사용해야 모달에서도 같은 정보를 보여줄 수 있음
const programs = [
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
    badge: '신청 가능',
    badgeClass: 'bg-[#e7f3ec] text-success',
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
    badge: '신청 가능',
    badgeClass: 'bg-[#e7f3ec] text-success',
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
    badge: '확인 필요',
    badgeClass: 'bg-[#fef3e2] text-warn',
  },
]

// 2️⃣ 모달 표시 여부를 관리하는 ref
// 왜? 사용자가 사업을 클릭했을 때 모달을 열고 닫아야 하는데, 이 값으로 모달의 v-if를 제어함
const showModal = ref(false)

// 3️⃣ 현재 선택된 지원사업 데이터를 저장하는 ref
// 왜? 사용자가 어떤 사업을 선택했는지 알아야 모달에 그 사업의 상세정보를 표시할 수 있음
const selectedProgram = ref(null)

// 4️⃣ 사업을 선택했을 때 실행되는 함수
// 왜? 클릭 이벤트 핸들러로, 사용자가 어떤 사업을 클릭했는지 감지하고 selectedProgram에 저장
function openDetail(program) {
  selectedProgram.value = program
  showModal.value = true
}

// 5️⃣ 모달을 닫는 함수
// 왜? 사용자가 닫기 버튼을 클릭했을 때, 모달을 숨기고 선택된 사업도 초기화
function closeModal() {
  showModal.value = false
  selectedProgram.value = null
}
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-[10px] p-[1.25rem_1.5rem] h-full">
    <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center gap-2">
      <div class="w-1 h-4 bg-brand rounded-sm"></div>
      추천 지원사업
    </div>
    <div class="flex flex-col">
      <!-- 6️⃣ 각 사업을 반복해서 표시하는 부분 -->
      <!-- 왜? programs 배열의 각 항목을 카드로 표시하고, 클릭 가능하게 만들어야 함 -->
      <div
        v-for="(p, i) in programs"
        :key="p.id"
        class="py-3.5 cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
        :class="i > 0 ? 'border-t border-gray-100' : ''"
        @click="openDetail(p)"
      >
        <!-- 7️⃣ 사업명과 상태 배지를 flex로 가로 정렬 -->
        <!-- 왜? 사업명은 왼쪽, 배지는 오른쪽에 배치해서 정보를 효율적으로 표시 -->
        <div class="flex justify-between items-start gap-2 mb-1.5">
          <div class="text-sm font-medium text-gray-900">{{ p.name }}</div>
          <div
            class="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
            :class="p.badgeClass"
          >
            {{ p.badge }}
          </div>
        </div>

        <!-- 8️⃣ 지원금액과 기한 정보 표시 -->
        <!-- 왜? 사용자가 빠르게 지원 규모와 기한을 파악할 수 있도록 -->
        <div class="flex gap-3 text-xs text-gray-500">
          <div class="text-brand font-bold">{{ p.subsidy }}</div>
          <div>마감: {{ p.deadline }}</div>
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
