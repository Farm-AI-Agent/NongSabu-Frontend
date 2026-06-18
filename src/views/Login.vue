<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AppFooter from '../components/AppFooter.vue'

const route = useRoute()
const router = useRouter()
const { login, signup } = useAuth()

const mode = ref('login')
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
})

const isLogin = computed(() => mode.value === 'login')
const submitLabel = computed(() => (isLogin.value ? '로그인' : '회원가입 후 시작하기'))
const footerText = computed(() =>
  isLogin.value
    ? '아직 회원이 아니신가요? 아래에서 회원가입 탭을 선택해 주세요.'
    : '이미 계정이 있으신가요? 아래에서 로그인 탭을 선택해 주세요.',
)

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand'

function resetMessages() {
  errorMessage.value = ''
}

function switchMode(nextMode) {
  mode.value = nextMode
  resetMessages()
}

async function onSubmit() {
  resetMessages()

  if (!form.email || !form.password) {
    errorMessage.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }

  if (!isLogin.value) {
    if (!form.name) {
      errorMessage.value = '이름을 입력해 주세요.'
      return
    }

    if (form.password.length < 8) {
      errorMessage.value = '비밀번호는 8자 이상이어야 합니다.'
      return
    }

    if (form.password !== form.passwordConfirm) {
      errorMessage.value = '비밀번호 확인이 일치하지 않습니다.'
      return
    }
  }

  isSubmitting.value = true

  try {
    if (isLogin.value) {
      await login({
        email: form.email,
        password: form.password,
      })
    } else {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      })

      await login({
        email: form.email,
        password: form.password,
      })
    }

    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirectPath)
  } catch (error) {
    errorMessage.value = error?.message || '인증 요청 처리 중 오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-page flex flex-col">
    <div class="h-1 bg-brand"></div>

    <div class="flex-1 flex items-center justify-center px-5 py-8">
      <div class="w-full max-w-[400px]">
        <div class="flex flex-col items-center gap-2.5 mb-7">
          <img src="/농사부.png" alt="농사부 로고" class="w-11 h-11 rounded-[10px]" />
          <div class="font-bold text-brand text-[22px] tracking-tight">작물닥터 농사부</div>
          <div class="text-[13px] text-gray-400">농업 병해충 진단 AI 비서</div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-7">
          <div class="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              class="flex-1 py-2.5 rounded-md text-sm"
              :class="isLogin ? 'bg-white text-brand font-bold shadow-sm' : 'bg-transparent text-gray-500 font-normal'"
              @click="switchMode('login')"
            >
              로그인
            </button>
            <button
              class="flex-1 py-2.5 rounded-md text-sm"
              :class="!isLogin ? 'bg-white text-brand font-bold shadow-sm' : 'bg-transparent text-gray-500 font-normal'"
              @click="switchMode('signup')"
            >
              회원가입
            </button>
          </div>

          <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
            <div v-if="!isLogin">
              <label class="block text-[13px] text-gray-600 mb-1.5">이름</label>
              <input v-model.trim="form.name" type="text" placeholder="이름을 입력해 주세요" :class="inputClass" />
            </div>

            <div>
              <label class="block text-[13px] text-gray-600 mb-1.5">이메일</label>
              <input v-model.trim="form.email" type="email" placeholder="이메일을 입력해 주세요" :class="inputClass" />
            </div>

            <div>
              <label class="block text-[13px] text-gray-600 mb-1.5">비밀번호</label>
              <input v-model="form.password" type="password" placeholder="비밀번호를 입력해 주세요" :class="inputClass" />
            </div>

            <div v-if="!isLogin">
              <label class="block text-[13px] text-gray-600 mb-1.5">비밀번호 확인</label>
              <input
                v-model="form.passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력해 주세요"
                :class="inputClass"
              />
            </div>

            <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

            <button
              type="submit"
              class="block text-center w-full py-3.5 bg-brand text-white rounded-lg text-[15px] font-medium mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? '처리 중...' : submitLabel }}
            </button>
          </form>
        </div>

        <div class="text-center text-xs text-gray-400 mt-5">{{ footerText }}</div>
      </div>
    </div>

    <div class="max-w-[760px] w-full mx-auto px-5">
      <AppFooter />
    </div>
  </div>
</template>
