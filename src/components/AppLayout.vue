<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const props = defineProps({
  active: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()
const { loggedIn, userName, accessToken } = useAuth()
const { farmLocation, setFarmLocation } = useFarmProfileState()

const navItems = [
  { label: '대시보드', to: '/' },
  { label: '병해충 분석', to: '/pest-analysis' },
  { label: '지원사업', to: '/support-programs' },
]

const policyLinks = ['이용약관', '개인정보처리방침']

const activeLabel = computed(() => {
  if (props.active) {
    return props.active
  }

  return navItems.find((item) => item.to === route.path)?.label || ''
})

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
    console.error('농장 지역 정보를 불러오지 못했습니다.', error)
  }
})
</script>

<template>
  <div class="min-h-screen bg-page md:pl-64">
    <aside class="md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-gray-200 flex flex-col z-30">
      <div class="h-1 bg-brand"></div>

      <div class="px-5 py-5 border-b border-gray-100">
        <router-link to="/" class="flex items-center gap-3 no-underline">
          <img src="/농사부.png" alt="농사부 로고" class="w-10 h-10 rounded-[10px]" />
          <div>
            <div class="font-bold text-brand text-lg tracking-tight">작물닥터 농사부</div>
            <div class="text-xs text-gray-400 mt-0.5">농업 병해충 진단 AI 비서</div>
          </div>
        </router-link>
      </div>

      <nav class="px-3 py-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        <router-link
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm no-underline whitespace-nowrap border"
          :class="
            activeLabel === item.label
              ? 'bg-brand text-white border-brand font-bold shadow-sm'
              : 'text-gray-600 border-transparent hover:bg-gray-50 hover:text-gray-900'
          "
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="activeLabel === item.label ? 'bg-white' : 'bg-brand/30'"
          ></span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="mt-auto px-4 pb-4 pt-3 border-t border-gray-100 space-y-4">
        <div class="space-y-2">
          <button
            v-for="link in policyLinks"
            :key="link"
            type="button"
            class="block w-full text-left text-xs text-gray-500 hover:text-brand transition-colors"
          >
            {{ link }}
          </button>
        </div>

        <button
          v-if="loggedIn"
          type="button"
          class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left hover:border-brand-border hover:bg-brand-light transition-colors"
          @click="goToMyPage"
        >
          <div class="text-[11px] text-gray-500 mb-1">지역 선택</div>
          <div class="text-sm font-semibold text-gray-900 truncate">{{ farmLocation }}</div>
        </button>

        <router-link
          v-if="loggedIn"
          to="/mypage"
          class="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 no-underline hover:border-brand-border transition-colors"
        >
          <div class="w-8 h-8 bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-bold text-sm">
            {{ userName.charAt(0) }}
          </div>
          <div class="min-w-0">
            <div class="text-[11px] text-gray-500">마이페이지</div>
            <div class="text-sm font-semibold text-gray-900 truncate">{{ userName }}</div>
          </div>
        </router-link>

        <div v-else class="grid grid-cols-2 gap-2">
          <router-link
            to="/login"
            class="text-center text-sm text-brand no-underline px-3 py-2 border border-brand-border rounded-md"
          >
            로그인
          </router-link>
          <router-link
            to="/login"
            class="text-center text-sm text-white no-underline px-3 py-2 bg-brand rounded-md"
          >
            회원가입
          </router-link>
        </div>
      </div>
    </aside>

    <main class="min-h-screen">
      <slot />
    </main>
  </div>
</template>
