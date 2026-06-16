<script setup>
import { ref, onMounted } from 'vue'

// 1️⃣ localStorage에서 할 일 데이터를 불러오거나, 없으면 기본값 사용
// 왜? 사용자가 추가/수정/삭제한 데이터가 새로고침 후에도 유지되어야 함
const checklist = ref([
  { id: 1, label: '오이 수확 및 정렬', sub: '재배지 A구간', done: true },
  { id: 2, label: '토마토 물 주기', sub: '오후 3시', done: true },
  { id: 3, label: '딸기 병해충 확인', sub: '매일 아침', done: false },
  { id: 4, label: '비료 주문', sub: '내일까지', done: false },
  { id: 5, label: '판매처 연락', sub: '주 1회', done: false },
])

// 2️⃣ 새로운 할 일을 추가할 때 입력받을 데이터
// 왜? 사용자가 제목과 설명을 각각 입력해야 하므로 두 개의 필드가 필요
const newLabel = ref('')
const newSub = ref('')

// 3️⃣ 추가 모달 표시 여부
// 왜? 사용자가 "+" 버튼을 클릭했을 때 모달을 표시하거나 숨기기 위해
const showAddModal = ref(false)

// 4️⃣ 수정 모달 표시 여부
// 왜? 사용자가 수정 버튼을 클릭했을 때 모달을 표시하거나 숨기기 위해
const showEditModal = ref(false)

// 5️⃣ 현재 수정 중인 항목의 인덱스
// 왜? 어떤 항목을 수정 중인지 알아야 모달에 그 데이터를 표시할 수 있음
const editingIndex = ref(null)

// 6️⃣ 수정 모달의 임시 데이터
// 왜? 수정 중에 사용자가 "취소"를 누르면 원래 데이터로 복구해야 함
const editLabel = ref('')
const editSub = ref('')

// 6️⃣ 체크박스를 클릭했을 때 완료/미완료 토글
// 왜? 사용자가 할 일을 완료했음을 표시할 수 있게
function toggle(i) {
  checklist.value[i].done = !checklist.value[i].done
  saveChecklist()
}

// 7️⃣ 새로운 할 일을 추가하는 함수
// 왜? 사용자가 입력한 제목과 설명으로 새로운 항목을 만들고, 리스트에 추가
function addItem() {
  // 입력값이 비어있으면 추가 안 함 (사용자 실수 방지)
  if (!newLabel.value.trim() || !newSub.value.trim()) {
    alert('제목과 설명을 모두 입력해주세요')
    return
  }

  checklist.value.push({
    id: Date.now(), // 왜? 각 항목에 고유한 ID를 부여해서 나중에 삭제할 때 정확하게 찾을 수 있게
    label: newLabel.value,
    sub: newSub.value,
    done: false,
  })

  saveChecklist()
  closeAddModal()
}

// 7️⃣ 추가 모달을 열고 입력 필드를 초기화하는 함수
// 왜? 사용자가 "+" 버튼을 클릭했을 때, 추가용 모달을 표시하고 비어있는 입력 필드를 보여줘야 함
function openAddModal() {
  newLabel.value = ''
  newSub.value = ''
  showAddModal.value = true
}

// 8️⃣ 추가 모달을 닫는 함수
// 왜? 사용자가 "취소"를 누르거나 모달을 벗어날 때, 모달을 숨기고 입력 필드를 초기화
function closeAddModal() {
  showAddModal.value = false
  newLabel.value = ''
  newSub.value = ''
}

// 9️⃣ 수정 모달을 열고 기존 데이터를 임시 필드에 복사하는 함수
// 왜? 사용자가 수정 버튼을 클릭했을 때, 모달을 표시하고 기존 데이터를 보여줘야 함
function openEditModal(i) {
  editingIndex.value = i
  editLabel.value = checklist.value[i].label
  editSub.value = checklist.value[i].sub
  showEditModal.value = true
}

// 9️⃣ 수정 모달에서 변경된 데이터를 저장하는 함수
// 왜? 사용자가 모달에서 입력한 새로운 데이터로 항목을 업데이트
function saveEdit() {
  if (!editLabel.value.trim() || !editSub.value.trim()) {
    alert('제목과 설명을 모두 입력해주세요')
    return
  }

  checklist.value[editingIndex.value].label = editLabel.value
  checklist.value[editingIndex.value].sub = editSub.value
  closeEditModal()
  saveChecklist()
}

// 🔟 수정 모달을 닫는 함수
// 왜? 사용자가 "취소"를 누르거나 모달을 벗어날 때, 모달을 숨기고 임시 데이터를 초기화
function closeEditModal() {
  showEditModal.value = false
  editingIndex.value = null
  editLabel.value = ''
  editSub.value = ''
}

// 1️⃣1️⃣ 항목을 삭제하는 함수
// 왜? 사용자가 더 이상 필요 없는 할 일을 제거할 수 있게
function deleteItem(i) {
  if (confirm('정말 삭제하시겠습니까?')) {
    checklist.value.splice(i, 1) // splice: 배열에서 i번째 위치의 1개 항목 제거
    saveChecklist()
  }
}

// 1️⃣2️⃣ localStorage에 현재 할 일 목록을 저장하는 함수
// 왜? 추가/수정/삭제 후 매번 호출해서 데이터를 영구 저장
function saveChecklist() {
  localStorage.setItem('fd_checklist', JSON.stringify(checklist.value))
}

// 1️⃣3️⃣ 컴포넌트가 처음 로드될 때 localStorage에서 데이터를 불러오는 함수
// 왜? 이전에 저장한 할 일 목록이 있으면 그것을 표시하고, 없으면 기본값 유지
onMounted(() => {
  const saved = localStorage.getItem('fd_checklist')
  if (saved) {
    try {
      checklist.value = JSON.parse(saved)
    } catch (e) {
      console.error('할 일 데이터 불러오기 실패:', e)
    }
  }
})
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-[10px] p-[1.25rem_1.5rem]">
    <!-- 1️⃣3️⃣ 헤더 (제목 + 추가 버튼) -->
    <!-- 왜? 사용자가 제목을 보고, 우상단에 있는 작은 "+" 버튼으로 쉽게 추가할 수 있게 -->
    <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-1 h-4 bg-brand rounded-sm"></div>
        오늘 할 일
      </div>
      <button
        @click="openAddModal"
        class="text-xs px-2 py-1 text-brand hover:bg-brand-light rounded transition-colors font-medium"
        title="할 일 추가"
      >
        + 추가
      </button>
    </div>

    <!-- 1️⃣4️⃣ 할 일 목록 -->
    <!-- 왜? 사용자가 모든 할 일을 한눈에 볼 수 있게 -->
    <div class="flex flex-col">
      <div
        v-for="(t, i) in checklist"
        :key="t.id"
        class="py-3.5 flex items-start gap-3"
        :class="i > 0 ? 'border-t border-gray-100' : ''"
      >
        <!-- 1️⃣5️⃣ 완료 체크박스 -->
        <!-- 왜? 사용자가 할 일을 완료했음을 표시할 수 있게 -->
        <div
          class="w-[18px] h-[18px] rounded-[5px] flex-shrink-0 mt-px flex items-center justify-center border-[1.5px] cursor-pointer transition-colors"
          :class="t.done ? 'bg-brand border-brand' : 'bg-white border-slate-300 hover:border-brand'"
          @click="toggle(i)"
        >
          <span v-if="t.done" class="text-white text-xs leading-none">✓</span>
        </div>

        <!-- 1️⃣6️⃣ 할 일 텍스트 -->
        <!-- 왜? 사용자가 할 일의 제목과 설명을 볼 수 있게 -->
        <div class="flex-1">
          <div
            class="text-sm"
            :class="t.done ? 'text-gray-400 line-through' : 'text-gray-900'"
          >
            {{ t.label }}
          </div>
          <div class="text-xs text-gray-400">{{ t.sub }}</div>
        </div>

        <!-- 1️⃣7️⃣ 수정 버튼 -->
        <!-- 왜? 사용자가 할 일을 수정할 수 있게 (삭제는 모달에서만 가능) -->
        <div class="flex-shrink-0 text-xs">
          <button
            @click="openEditModal(i)"
            class="px-2 py-1 text-gray-500 hover:text-brand hover:bg-brand-light rounded transition-colors"
            title="수정"
          >
            수정
          </button>
        </div>
      </div>

      <!-- 1️⃣8️⃣ 할 일이 없을 때 표시할 메시지 -->
      <!-- 왜? 사용자가 할 일이 없는 상태를 직관적으로 이해할 수 있게 -->
      <div v-if="checklist.length === 0" class="text-center py-6 text-gray-400 text-sm">
        아직 할 일이 없습니다. 위에서 추가해보세요!
      </div>
    </div>

    <!-- 1️⃣9️⃣ 추가 모달 -->
    <!-- 왜? 사용자가 "+" 버튼을 클릭했을 때 모달에서 할 일을 추가할 수 있게 -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeAddModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">할 일 추가</h2>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
            <input
              v-model="newLabel"
              type="text"
              placeholder="할 일 제목"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              @keyup.enter="addItem"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
            <input
              v-model="newSub"
              type="text"
              placeholder="설명 (예: 오후 3시, 재배지 A구간)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              @keyup.enter="addItem"
            />
          </div>
        </div>

        <div class="flex gap-3 p-6 pt-0">
          <button
            @click="closeAddModal"
            class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            @click="addItem"
            class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>

    <!-- 3️⃣0️⃣ 수정 모달 -->
    <!-- 왜? 사용자가 수정 버튼을 클릭했을 때 모달에서 데이터를 입력 받고 저장할 수 있게 -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">할 일 수정</h2>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">제목</label>
            <input
              v-model="editLabel"
              type="text"
              placeholder="할 일 제목"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              @keyup.enter="saveEdit"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
            <input
              v-model="editSub"
              type="text"
              placeholder="설명 (예: 오후 3시, 재배지 A구간)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              @keyup.enter="saveEdit"
            />
          </div>
        </div>

        <div class="flex gap-3 p-6 pt-0">
          <button
            @click="() => { if (confirm('정말 삭제하시겠습니까?')) { deleteItem(editingIndex); closeEditModal() } }"
            class="flex-1 py-2.5 px-4 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            삭제
          </button>
          <button
            @click="closeEditModal"
            class="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            @click="saveEdit"
            class="flex-1 py-2.5 px-4 bg-brand text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
