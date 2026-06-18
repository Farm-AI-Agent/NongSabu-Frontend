<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-auto border-t border-gray-200 pt-8 pb-4 text-xs text-gray-500">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <div class="font-semibold text-gray-700">작물닥터 농사부</div>
        <div class="mt-1">농장 관리와 병해충 진단을 돕는 농업 AI 서비스</div>
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-2">
        <span>© {{ year }} NongSabu</span>
        <span>이용약관</span>
        <span>개인정보처리방침</span>
      </div>
    </div>
  </footer>
</template>
