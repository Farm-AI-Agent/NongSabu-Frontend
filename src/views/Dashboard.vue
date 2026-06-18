<script setup>
import AppHeader from '../components/AppHeader.vue'
import Sidebar from '../components/Sidebar.vue'
import FloatingChatButton from '../components/FloatingChatButton.vue'
import AppFooter from '../components/AppFooter.vue'
import WeatherFarmBriefingCard from '../components/WeatherFarmBriefingCard.vue'
import RecommendedProgramsCard from '../components/RecommendedProgramsCard.vue'
import ChecklistCard from '../components/ChecklistCard.vue'
import { useAuth } from '../composables/useAuth'

const { userName } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-page">
    <div class="h-1 bg-brand"></div>
    <AppHeader />
    <Sidebar />

    <div class="px-5 py-7 mx-auto ml-64 pt-20 min-h-screen flex flex-col">
      <!-- Greeting -->
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">좋은 아침이에요, {{ userName }} 님</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">오늘의 농장 현황</div>
      </div>

      <WeatherFarmBriefingCard />

      <div
        class="grid gap-4 mb-6 auto-rows-fr"
        style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))"
      >
        <div class="h-full">
          <RecommendedProgramsCard />
        </div>
        <div class="h-full">
          <ChecklistCard />
        </div>
      </div>

      <AppFooter />
    </div>

    <FloatingChatButton />
  </div>
</template>
