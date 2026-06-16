<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const mode = ref('login') // 'login' | 'signup'
const isLogin = computed(() => mode.value === 'login')
const isSignup = computed(() => mode.value === 'signup')

const submitLabel = computed(() => (isLogin.value ? '로그인' : '회원가입 완료'))
const socialLabel = computed(() => (isLogin.value ? '로그인' : '시작하기'))
const footerText = computed(() =>
  isLogin.value
    ? '아직 회원이 아니신가요? 위에서 회원가입을 선택하세요.'
    : '이미 계정이 있으신가요? 위에서 로그인을 선택하세요.',
)

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand'

function onSubmit() {
  login()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-page flex flex-col">
    <div class="h-1 bg-brand"></div>

    <div class="flex-1 flex items-center justify-center px-5 py-8">
      <div class="w-full max-w-[400px]">
        <!-- Logo -->
        <div class="flex flex-col items-center gap-2.5 mb-7">
          <img src="/농사부.png" alt="농사부 로고" class="w-11 h-11 rounded-[10px]" />
          <div class="font-bold text-brand text-[22px] tracking-tight">작물닥터 농사부</div>
          <div class="text-[13px] text-gray-400">농업 병해충 진단 비서</div>
        </div>

        <!-- Card -->
        <div class="bg-white border border-gray-200 rounded-xl p-7">
          <!-- Tab toggle -->
          <div class="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              class="flex-1 py-2.5 rounded-md text-sm"
              :class="
                isLogin
                  ? 'bg-white text-brand font-bold shadow-sm'
                  : 'bg-transparent text-gray-500 font-normal'
              "
              @click="mode = 'login'"
            >
              로그인
            </button>
            <button
              class="flex-1 py-2.5 rounded-md text-sm"
              :class="
                isSignup
                  ? 'bg-white text-brand font-bold shadow-sm'
                  : 'bg-transparent text-gray-500 font-normal'
              "
              @click="mode = 'signup'"
            >
              회원가입
            </button>
          </div>

          <!-- Form -->
          <div class="flex flex-col gap-4">
            <div v-if="isSignup">
              <label class="block text-[13px] text-gray-600 mb-1.5">이름</label>
              <input type="text" placeholder="홍길동" :class="inputClass" />
            </div>

            <div>
              <label class="block text-[13px] text-gray-600 mb-1.5">아이디</label>
              <input type="text" placeholder="아이디를 입력하세요" :class="inputClass" />
            </div>

            <div>
              <label class="block text-[13px] text-gray-600 mb-1.5">비밀번호</label>
              <input type="password" placeholder="비밀번호를 입력하세요" :class="inputClass" />
            </div>

            <div v-if="isSignup">
              <label class="block text-[13px] text-gray-600 mb-1.5">비밀번호 확인</label>
              <input type="password" placeholder="비밀번호를 다시 입력하세요" :class="inputClass" />
            </div>

            <div v-if="isSignup">
              <label class="block text-[13px] text-gray-600 mb-1.5">지역</label>
              <input type="text" placeholder="예: 전북 김제" :class="inputClass" />
            </div>

            <div v-if="isLogin" class="flex justify-between items-center text-[13px]">
              <label class="flex items-center gap-1.5 text-gray-500 cursor-pointer">
                <input type="checkbox" class="accent-brand" /> 로그인 상태 유지
              </label>
              <a href="#" class="text-accent no-underline">비밀번호 찾기</a>
            </div>

            <button
              class="block text-center w-full py-3.5 bg-brand text-white rounded-lg text-[15px] font-medium mt-1"
              @click="onSubmit"
            >
              {{ submitLabel }}
            </button>
          </div>

        </div>

        <div class="text-center text-xs text-gray-400 mt-5">{{ footerText }}</div>
      </div>
    </div>
  </div>
</template>
