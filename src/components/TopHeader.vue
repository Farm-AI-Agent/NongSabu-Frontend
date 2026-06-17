<template>
  <header class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 h-14 z-40">
    <!-- logo positioned absolutely to the far left (over sidebar area) -->
    <div class="absolute left-3 top-1.5 flex items-center gap-3 z-50">
      <router-link to="/" class="flex items-center gap-3 no-underline transform scale-150 origin-left">
        <img src="/농사부.png" alt="농사부 로고" class="w-9 h-9 rounded-md" />
        <div>
          <div class="font-bold text-brand text-lg tracking-tight">작물닥터 농사부</div>
        </div>
      </router-link>
    </div>

    <!-- main header spacer to align content right of sidebar -->
    <div class="h-full flex items-center pl-56 pr-6">
      <!-- empty - left area reserved for logo -->
    </div>
  </header>
</template>

<script setup>
// simple top header with logo and site name only
</script>

<style scoped>
/* ensure header doesn't overlap content; content views have top padding */
</style>
