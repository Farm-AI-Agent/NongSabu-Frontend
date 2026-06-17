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
        <div class="text-gray-400 text-[13px] mb-1.5">고객센터 · 문의</div>
        <div class="text-[26px] font-bold text-gray-900 tracking-tight">고객센터 문의</div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <p class="text-sm text-gray-700 mb-3">아래는 더미 고객센터 항목입니다. 실제 문의처 연결을 위해 수정하세요.</p>
        <ul class="list-disc pl-5 text-sm text-gray-600 space-y-2">
          <li>운영시간: 평일 09:00 - 18:00</li>
          <li>문의 이메일: support@example.com</li>
          <li>전화: 02-0000-0000</li>
          <li>문의 유형 선택 폼(더미): 기술/결제/기타</li>
        </ul>
      </div>

    </div>

    <FloatingChatButton />
  </div>
</template>
