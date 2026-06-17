<script setup>
// AppHeader is rendered globally from App.vue
// NavTabs removed per design
import FloatingChatButton from '../components/FloatingChatButton.vue'
</script>

<template>
  <div class="min-h-screen bg-page pl-60">
    <div class="h-1 bg-brand"></div>
    

    <div class="px-5 py-7 max-w-shell mx-auto">
      <div class="mb-6 border-b border-gray-200 pb-5">
        <div class="text-gray-400 text-[13px] mb-1.5">이용약관 및 정책</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">이용약관 및 개인정보 처리방침</div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p class="text-sm text-gray-700">이곳은 더미 약관 텍스트입니다. 실제 약관 내용을 여기에 붙여넣어주세요.</p>
        <p class="text-xs text-gray-500">(더미 텍스트) 제1조 (목적) 이 약관은 ...</p>
        <p class="text-xs text-gray-500">(더미 텍스트) 제2조 (정의) ...</p>
      </div>
    </div>

    <FloatingChatButton />
  </div>
</template>
