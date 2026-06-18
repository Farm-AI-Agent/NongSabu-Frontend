<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const router = useRouter()
const { loggedIn, userName, accessToken } = useAuth()
const { farmLocation, setFarmLocation } = useFarmProfileState()

function goToMyPage() {
  router.push('/mypage')
}

onMounted(async () => {
  if (!loggedIn.value || !accessToken.value) {
    return
  }

  try {
    const farmProfile = await apiRequest('/api/v1/farm-profiles/me', { token: accessToken.value })
    setFarmLocation(farmProfile.region)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return
    }
    console.error('Failed to load farm location.', error)
  }
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
    <div class="w-full px-8 py-4 flex justify-between items-center flex-wrap gap-3">
      <router-link to="/" class="flex items-center gap-3 no-underline">
        <img src="/농사부.png" alt="NongSabu logo" class="w-12 h-12 object-contain" />
        <div class="font-bold text-brand text-xl tracking-tight">작물닥터 농사부</div>
        <div class="text-[13px] text-gray-400 ml-1 hidden sm:block">작물 병해충 진단 AI 어시스턴트</div>
      </router-link>

      <div class="flex items-center gap-5">
        <div v-if="!loggedIn" class="flex items-center gap-2">
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
            가입
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>
