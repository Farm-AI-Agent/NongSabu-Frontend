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
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-shell mx-auto px-5 py-3.5 flex justify-between items-center flex-wrap gap-3">
      <router-link to="/" class="flex items-center gap-2.5 no-underline">
        <img src="/농사부.png" alt="NongSabu logo" class="w-9 h-9 rounded-md" />
        <div class="font-bold text-brand text-lg tracking-tight">Crop Doctor NongSabu</div>
        <div class="text-xs text-gray-400 ml-1 hidden sm:block">AI assistant for crop disease diagnosis</div>
      </router-link>

      <div class="flex items-center gap-5">
        <button
          v-if="loggedIn"
          @click="goToMyPage"
          class="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <span>Location</span>
          <span>{{ farmLocation }}</span>
        </button>

        <router-link
          v-if="loggedIn"
          to="/mypage"
          class="text-xs text-gray-500 flex items-center gap-1.5 no-underline"
        >
          <div class="w-7 h-7 bg-brand-light border border-brand-border rounded-full text-brand flex items-center justify-center font-medium text-xs">
            {{ userName.charAt(0) }}
          </div>
          {{ userName }}
        </router-link>

        <div v-else class="flex items-center gap-2">
          <router-link
            to="/login"
            class="text-sm text-brand no-underline px-3.5 py-1.5 border border-brand-border rounded-md"
          >
            Login
          </router-link>
          <router-link
            to="/login"
            class="text-sm text-white no-underline px-3.5 py-1.5 bg-brand rounded-md"
          >
            Sign up
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>