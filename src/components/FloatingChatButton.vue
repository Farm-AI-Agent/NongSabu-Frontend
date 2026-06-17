<script setup>
// 오른쪽 아래 고정 채팅 버튼 — 클릭 시 상담 화면으로 이동
</script>

<template>
  <router-link
    to="/chat"
    class="fixed bottom-7 right-7 w-14 h-14 bg-brand rounded-full flex items-center justify-center z-50 no-underline shadow-[0_4px_14px_rgba(14,110,93,0.35)]"
    aria-label="AI 상담 채팅"
  >
    <svg width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="16" rx="6" stroke="white" stroke-width="2" />
      <path d="M7 17 L7 21 L13 17 Z" fill="white" />
      <circle cx="8" cy="9" r="1.5" fill="white" />
      <circle cx="15" cy="9" r="1.5" fill="white" />
    </svg>
  </router-link>
</template>
