<script setup>
// 대시보드용 병해충 이미지 분석 진입 카드 — CTA는 분석 페이지로 이동
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-[10px] p-[1.25rem_1.5rem]">
    <div class="text-[15px] font-bold text-gray-900 mb-[1.1rem] flex items-center gap-2">
      <div class="w-1 h-4 bg-brand rounded-sm"></div>
      병해충 이미지 분석
    </div>

    <div
      class="border-[1.5px] border-dashed border-slate-300 rounded-[10px] p-8 text-center mb-4 bg-[#fafbfc]"
    >
      <div
        class="w-10 h-10 bg-brand-light rounded-lg mx-auto mb-3 flex items-center justify-center"
      >
        <div class="w-[18px] h-[18px] border-2 border-brand rounded"></div>
      </div>
      <div class="text-gray-600 text-[13px] mb-1">진단할 사진을 여기에 끌어 놓거나</div>
      <div class="text-accent text-[13px]">사진찾기 버튼을 클릭하세요</div>
    </div>

    <router-link
      to="/pest-analysis"
      class="block text-center w-full py-3.5 bg-accent text-white rounded-lg font-medium text-sm no-underline"
    >
      사진 업로드 &amp; 분석 시작
    </router-link>
  </div>
</template>
