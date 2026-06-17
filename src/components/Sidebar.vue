<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useFarmProfileState } from '../composables/useFarmProfileState'

const router = useRouter()
const route = useRoute()
const { loggedIn, userName } = useAuth()
const { farmLocation } = useFarmProfileState()

const menuItems = [
  { label: '대시보드', path: '/', icon: '📊' },
  { label: '병해충 분석', path: '/pest-analysis', icon: '🔍' },
  { label: '지원사업', path: '/support-programs', icon: '💡' },
  { label: '진단 이력', path: '/diagnosis-history', icon: '📋' },
  { label: '관심 사업', path: '/favorites', icon: '⭐' },
]

const isActive = (path) => {
  return route.path === path
}

function goToMyPage() {
  router.push('/mypage')
}
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 fixed left-0 top-20 bottom-0 z-40 flex flex-col">
    <nav class="px-4 py-6 space-y-2 flex-1">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm no-underline transition-colors"
        :class="
          isActive(item.path)
            ? 'bg-brand/10 text-brand font-medium'
            : 'text-gray-600 hover:bg-gray-100'
        "
      >
        <span>{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- User Profile Section -->
    <div v-if="loggedIn" class="border-t border-gray-200 p-4">
      <button
        @click="goToMyPage"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
      >
        <div class="w-10 h-10 bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-bold text-sm flex-shrink-0">
          {{ userName.charAt(0) }}
        </div>
        <div class="flex-1 text-left">
          <div class="text-sm font-medium text-gray-900">{{ userName }}</div>
          <div class="text-xs text-gray-500">{{ farmLocation || '지역 미설정' }}</div>
        </div>
      </button>
    </div>
  </aside>
</template>
