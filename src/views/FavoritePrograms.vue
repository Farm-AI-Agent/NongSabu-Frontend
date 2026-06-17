<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'

const favorites = ref([])

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem('fd_fav_programs') || '[]')
  } catch (e) {
    return []
  }
}

function saveFavorites(list) {
  localStorage.setItem('fd_fav_programs', JSON.stringify(list))
}

function toggleLike(program) {
  // remove from favorites
  const updated = favorites.value.filter(p => p.id !== program.id)
  favorites.value = updated
  saveFavorites(updated)
}

onMounted(() => {
  favorites.value = loadFavorites()
})
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <Sidebar />

    <div class="px-5 py-7 mx-auto ml-64 pt-20">
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">관심 지원사업</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">내가 찜한 지원사업</div>
      </div>

      <div v-if="favorites.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-sm">아직 찜한 지원사업이 없습니다.</div>
      </div>

      <div class="space-y-4 mb-8">
        <div
          v-for="program in favorites"
          :key="program.id"
          class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[11px] font-medium px-2.5 py-1 bg-brand-light text-brand rounded-full">
                  {{ program.category }}
                </span>
                <span class="text-[11px] font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {{ program.crop }}
                </span>
              </div>
              <div class="text-[15px] font-bold text-gray-900 mb-1 truncate">
                {{ program.name }}
              </div>
              <div class="flex gap-4 text-sm">
                <div class="text-brand font-bold">{{ program.subsidy }}</div>
                <div class="text-gray-500">마감: {{ program.deadline }}</div>
              </div>
            </div>
            <button
              @click="toggleLike(program)"
              class="flex-shrink-0 text-2xl text-red-500"
            >
              ❤️
            </button>
          </div>
        </div>
      </div>
    </div>

    <FloatingChatButton />
  </div>
</template>
